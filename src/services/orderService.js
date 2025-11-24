import prisma from '../config/database.js';
import emailNotificationService from './emailNotificationService.js';
import phonepeService from './phonepeService.js';
import logger from '../utils/logger.js';
import razorpayService from './razorpayService.js';  
import customImageUploadService from './customImageUploadService.js';

class OrderService {
  generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async calculateOrderTotals(orderItems, couponCode = null) {
    let subtotal = 0;
    
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      throw new Error('Order items are required and must be a non-empty array');
    }

    // Calculate subtotal
    for (const item of orderItems) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new Error('Invalid order item: productId and quantity are required');
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          normalPrice: true,
          offerPrice: true,
          wholesalePrice: true,
          status: true
        }
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (product.status !== 'ACTIVE') {
        throw new Error(`Product ${product.id} is not available for purchase`);
      }

      // Check variant stock if provided
      if (item.productVariantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.productVariantId },
          select: { stock: true }
        });

        if (!variant) {
          throw new Error(`Product variant not found: ${item.productVariantId}`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(`Insufficient stock for variant ${item.productVariantId}. Available: ${variant.stock}, Requested: ${item.quantity}`);
        }
      }

      const price = product.offerPrice || product.normalPrice;
      subtotal += price * item.quantity;
    }

    // Calculate discount
    let discount = 0;
    let coupon = null;
    
    if (couponCode) {
      coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
          OR: [
            { usageLimit: null },
            { usageLimit: { gt: prisma.coupon.fields.usedCount } }
          ]
        }
      });

      if (coupon) {
        if (subtotal >= (coupon.minOrderAmount || 0)) {
          if (coupon.discountType === 'PERCENTAGE') {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
              discount = coupon.maxDiscount;
            }
          } else {
            discount = coupon.discountValue;
          }
        }
      }
    }

    // Free shipping for all orders
    const shippingCost = 0;
    const totalAmount = subtotal - discount + shippingCost;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      coupon
    };
  }

  async initiateRazorpayPayment(orderData) {
    const {
      userId,
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      orderItems,
      couponCode,
      customImages = [] // Optional custom images
    } = orderData;

    // Validate required fields
    if (!name || !email || !phone || !address || !city || !state || !pincode) {
      throw new Error('All shipping information fields are required');
    }

    // Calculate totals
    const totals = await this.calculateOrderTotals(orderItems, couponCode);

    // Create Razorpay order (this is just a payment order, not our actual order)
    const razorpayOrder = await razorpayService.createOrder(
      totals.totalAmount,
      'INR'
    );

    // Store temporary order data
    const tempOrderData = {
      userId,
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      orderItems,
      couponCode,
      customImages, // Include custom images in temp data
      totals,
      razorpayOrderId: razorpayOrder.id
    };

    logger.info(`Razorpay order initiated for user ${userId}, Amount: ${totals.totalAmount}, Custom Images: ${customImages.length}`);

    return {
      razorpayOrder,
      tempOrderData: {
        ...tempOrderData,
        orderNumber: this.generateOrderNumber()
      }
    };
  }

  async verifyAndCreateOrder(paymentData) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData
    } = paymentData;

    // Verify payment signature
    const isValid = razorpayService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      throw new Error('Payment verification failed');
    }

    // Calculate totals again to ensure consistency
    const totals = await this.calculateOrderTotals(orderData.orderItems, orderData.couponCode);

    // Process and upload custom images to S3
    let uploadedCustomImages = [];
    if (orderData.customImages && orderData.customImages.length > 0) {
      try {
        uploadedCustomImages = await customImageUploadService.processCustomImagesForOrder(
          orderData.customImages,
          orderData.userId
        );
      } catch (uploadError) {
        logger.error('Custom images upload failed for payment order', {
          userId: orderData.userId,
          error: uploadError.message
        });
        throw new Error(`Custom images upload failed: ${uploadError.message}`);
      }
    }

    // Create the actual order in database
    const order = await prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        userId: orderData.userId,
        name: orderData.name,
        email: orderData.email,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        state: orderData.state,
        pincode: orderData.pincode,
        status: 'CONFIRMED',
        totalAmount: totals.totalAmount,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shippingCost: totals.shippingCost,
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        couponId: totals.coupon?.id || null,
        // Create custom image records with actual S3 URLs
        customImages: uploadedCustomImages.length > 0 ? {
          create: uploadedCustomImages.map(img => ({
            imageUrl: img.url,
            imageKey: img.key,
            filename: img.filename
          }))
        } : undefined,
        orderItems: {
          create: await Promise.all(
            orderData.orderItems.map(async (item) => {
              const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: {
                  normalPrice: true,
                  offerPrice: true,
                  name: true,
                  productCode: true
                }
              });

              const price = product.offerPrice || product.normalPrice;

              return {
                productId: item.productId,
                productVariantId: item.productVariantId || null,
                quantity: item.quantity,
                price: price
              };
            })
          )
        }
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                }
              }
            },
            productVariant: {
              select: {
                id: true,
                color: true,
                size: true
              }
            }
          }
        },
        customImages: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        coupon: true
      }
    });

    // Update stock for variants
    for (const item of orderData.orderItems) {
      if (item.productVariantId) {
        await prisma.productVariant.update({
          where: { id: item.productVariantId },
          data: {
            stock: { decrement: item.quantity }
          }
        });
      }
    }

    // Increment coupon usage
    if (totals.coupon) {
      await prisma.coupon.update({
        where: { id: totals.coupon.id },
        data: {
          usedCount: { increment: 1 }
        }
      });
    }

    // Create tracking history
    await prisma.trackingHistory.create({
      data: {
        orderId: order.id,
        status: 'CONFIRMED',
        description: 'Order confirmed and payment received',
        location: `${order.city}, ${order.state}`
      }
    });

    // Send email notification
    try {
      await emailNotificationService.sendOrderNotifications(order);
    } catch (emailError) {
      logger.error('Failed to send order confirmation email:', emailError);
    }

    logger.info(`Order created successfully with ${uploadedCustomImages.length} custom images: ${order.orderNumber}`);
    return order;
  }


  async initiatePhonePePayment(orderData) {
    const {
      userId,
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      orderItems,
      couponCode,
      customImages = [],
      paymentMethod = 'ONLINE',
      redirectUrl,
      callbackUrl
    } = orderData;

    // Validate required fields
    if (!name || !email || !phone || !address || !city || !state || !pincode) {
      throw new Error('All shipping information fields are required');
    }

    // Calculate totals
    const totals = await this.calculateOrderTotals(orderItems, couponCode);

    // Process and upload custom images to S3
    let uploadedCustomImages = [];
    if (customImages.length > 0) {
      try {
        uploadedCustomImages = await CustomImageUploadService.processCustomImagesForOrder(
          customImages,
          userId
        );
      } catch (uploadError) {
        logger.error('Custom images upload failed for PhonePe order', {
          userId,
          error: uploadError.message
        });
        throw new Error(`Custom images upload failed: ${uploadError.message}`);
      }
    }

    // Create order with PENDING status
    const order = await prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        userId,
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        status: 'PENDING',
        totalAmount: totals.totalAmount,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shippingCost: totals.shippingCost,
        paymentStatus: 'PENDING',
        paymentMethod,
        couponId: totals.coupon?.id || null,
        // Create custom image records with actual S3 URLs
        customImages: uploadedCustomImages.length > 0 ? {
          create: uploadedCustomImages.map(img => ({
            imageUrl: img.url,
            imageKey: img.key,
            filename: img.filename
          }))
        } : undefined,
        orderItems: {
          create: await Promise.all(
            orderItems.map(async (item) => {
              const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: {
                  normalPrice: true,
                  offerPrice: true,
                  name: true,
                  productCode: true
                }
              });

              const price = product.offerPrice || product.normalPrice;

              return {
                productId: item.productId,
                productVariantId: item.productVariantId || null,
                quantity: item.quantity,
                price: price
              };
            })
          )
        }
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                }
              }
            },
            productVariant: {
              select: {
                id: true,
                color: true,
                size: true
              }
            }
          }
        },
        customImages: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        coupon: true
      }
    });

    // Initiate PhonePe payment
    const paymentData = {
      orderId: order.id,
      amount: order.totalAmount,
      userId: order.userId,
      redirectUrl,
      callbackUrl
    };

    const paymentResponse = await phonepeService.initiatePayment(paymentData);

    // Update order with merchant transaction ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        phonepeMerchantTransactionId: paymentResponse.merchantTransactionId
      }
    });

    logger.info(`PhonePe payment initiated for order: ${order.orderNumber}, Custom Images: ${customImages.length}, Merchant TXN: ${paymentResponse.merchantTransactionId}`);

    return {
      order,
      payment: paymentResponse
    };
  }

  async handlePhonePeCallback(callbackData) {
    const { 
      merchantTransactionId, 
      transactionId, 
      code, 
      message, 
      paymentInstrument 
    } = callbackData;

    try {
      // Verify payment status with PhonePe
      const statusResponse = await phonepeService.checkPaymentStatus(merchantTransactionId);

      const order = await prisma.order.findFirst({
        where: { phonepeMerchantTransactionId: merchantTransactionId },
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  images: {
                    take: 1,
                    select: {
                      imageUrl: true
                    }
                  }
                }
              },
              productVariant: true
            }
          },
          customImages: true // Include custom images
        }
      });

      if (!order) {
        throw new Error('Order not found for merchant transaction ID: ' + merchantTransactionId);
      }

      let updateData = {};
      let newOrderStatus = order.status;
      let newPaymentStatus = order.paymentStatus;

      if (statusResponse.success && statusResponse.code === 'PAYMENT_SUCCESS') {
        updateData = {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          phonepeTransactionId: transactionId,
          phonepeResponseCode: code,
          phonepeResponseMessage: message,
          phonepePaymentInstrumentType: paymentInstrument?.type
        };
        newOrderStatus = 'CONFIRMED';
        newPaymentStatus = 'PAID';

        // Update stock for variants
        for (const item of order.orderItems) {
          if (item.productVariantId) {
            await prisma.productVariant.update({
              where: { id: item.productVariantId },
              data: {
                stock: { decrement: item.quantity }
              }
            });
          }
        }

        // Increment coupon usage
        if (order.couponId) {
          await prisma.coupon.update({
            where: { id: order.couponId },
            data: {
              usedCount: { increment: 1 }
            }
          });
        }

      } else if (statusResponse.code === 'PAYMENT_ERROR' || statusResponse.code === 'PAYMENT_FAILED') {
        updateData = {
          paymentStatus: 'FAILED',
          phonepeResponseCode: code,
          phonepeResponseMessage: message || statusResponse.message
        };
        newPaymentStatus = 'FAILED';
      } else {
        // Handle other statuses like PENDING, etc.
        updateData = {
          phonepeResponseCode: code,
          phonepeResponseMessage: message || statusResponse.message
        };
      }

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: updateData,
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  images: {
                    take: 1,
                    select: {
                      imageUrl: true
                    }
                  }
                }
              },
              productVariant: {
                select: {
                  id: true,
                  color: true,
                  size: true
                }
              }
            }
          },
          customImages: true, // Include custom images
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Create tracking history for status change
      if (newOrderStatus !== order.status) {
        await prisma.trackingHistory.create({
          data: {
            orderId: order.id,
            status: newOrderStatus,
            description: this.getStatusDescription(newOrderStatus),
            location: `${order.city}, ${order.state}`
          }
        });

        // Send email notifications for successful payment
        if (newOrderStatus === 'CONFIRMED') {
          try {
            await emailNotificationService.sendOrderNotifications(updatedOrder);
          } catch (emailError) {
            logger.error('Failed to send order confirmation email:', emailError);
          }
        }
      }

      logger.info(`PhonePe callback processed: ${merchantTransactionId}, Status: ${newPaymentStatus}, Order: ${order.orderNumber}, Custom Images: ${order.customImages.length}`);
      return updatedOrder;

    } catch (error) {
      logger.error('Error handling PhonePe callback:', error);
      throw error;
    }
  }

  async getAllOrders({ page, limit, status, userId, paymentStatus }) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  images: {
                    take: 1,
                    select: {
                      imageUrl: true
                    }
                  }
                }
              },
              productVariant: {
                select: {
                  id: true,
                  color: true,
                  size: true
                }
              }
            }
          },
          customImages: true, // Include custom images
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          coupon: true,
          trackingHistory: {
            take: 5,
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.order.count({ where })
    ]);
    
    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getOrderById(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }, // This expects a UUID, not orderNumber
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                }
              }
            },
            productVariant: {
              select: {
                id: true,
                color: true,
                size: true
              }
            }
          }
        },
        customImages: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        coupon: true,
        trackingHistory: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return order;
  }

  async getOrderByOrderNumber(orderNumber) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                }
              }
            },
            productVariant: {
              select: {
                id: true,
                color: true,
                size: true
              }
            }
          }
        },
        customImages: true, // Include custom images
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        coupon: true,
        trackingHistory: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return order;
  }

  async updateOrderStatus(orderId, statusData) {
    const { status, adminNotes } = statusData;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }
    
    const oldStatus = order.status;
    
    const updateData = {
      status,
      ...(adminNotes && { adminNotes })
    };

    // Set timestamps for specific status changes
    if (status === 'SHIPPED' && order.status !== 'SHIPPED') {
      updateData.shippedAt = new Date();
    }
    
    if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                }
              }
            },
            productVariant: {
              select: {
                id: true,
                color: true,
                size: true
              }
            }
          }
        },
        customImages: true, // Include custom images
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    

    if (status !== order.status) {
      await prisma.trackingHistory.create({
        data: {
          orderId,
          status,
          description: this.getStatusDescription(status),
          location: `${order.city}, ${order.state}`
        }
      });

      try {
        await emailNotificationService.sendOrderStatusUpdate(updatedOrder, oldStatus, status);
      } catch (emailError) {
        logger.error('Failed to send status update email:', emailError);
      }
    }
    
    logger.info(`Order status updated: ${orderId} -> ${status}`);
    return updatedOrder;
  }

  async updateTrackingInfo(orderId, trackingData) {
    const { trackingNumber, carrier, trackingUrl, estimatedDelivery } = trackingData;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        carrier,
        trackingUrl,
        estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
        status: 'SHIPPED',
        shippedAt: new Date()
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                }
              }
            },
            productVariant: {
              select: {
                id: true,
                color: true,
                size: true
              }
            }
          }
        },
        customImages: true, // Include custom images
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    await prisma.trackingHistory.create({
      data: {
        orderId,
        status: 'SHIPPED',
        description: `Order shipped via ${carrier}. Tracking number: ${trackingNumber}`,
        location: `${order.city}, ${order.state}`
      }
    });

    try {
      await emailNotificationService.sendOrderStatusUpdate(updatedOrder, order.status, 'SHIPPED');
    } catch (emailError) {
      logger.error('Failed to send shipping notification email:', emailError);
    }
    
    logger.info(`Tracking info updated for order: ${orderId}`);
    return updatedOrder;
  }

  async processRefund(orderId, refundData) {
    const { refundAmount, reason, adminNotes } = refundData;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                }
              }
            },
            productVariant: true
          }
        },
        customImages: true // Include custom images
      }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.paymentStatus !== 'PAID') {
      throw new Error('Cannot refund order that is not paid');
    }
    
    if (order.status === 'REFUNDED') {
      throw new Error('Order is already refunded');
    }

    if (!order.phonepeTransactionId) {
      throw new Error('Original transaction ID not found for refund');
    }
    
    let phonepeRefundId = null;
    try {
      const refundResponse = await phonepeService.processRefund(
        order.phonepeTransactionId,
        refundAmount || order.totalAmount,
        `REFUND_${order.id}`
      );
      
      if (refundResponse.success) {
        phonepeRefundId = refundResponse.data.merchantRefundId;
      } else {
        throw new Error(refundResponse.message || 'Refund failed');
      }
    } catch (phonepeError) {
      logger.error('PhonePe refund failed:', phonepeError);
      throw new Error('Refund processing failed: ' + phonepeError.message);
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
        ...(adminNotes && { adminNotes })
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                }
              }
            },
            productVariant: {
              select: {
                id: true,
                color: true,
                size: true
              }
            }
          }
        },
        customImages: true, // Include custom images
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    await prisma.trackingHistory.create({
      data: {
        orderId,
        status: 'REFUNDED',
        description: `Order refunded. Amount: ₹${refundAmount || order.totalAmount}. Reason: ${reason}. Refund ID: ${phonepeRefundId}`,
        location: 'System'
      }
    });
    
    // Restore stock for refunded items
    for (const item of order.orderItems) {
      if (item.productVariantId) {
        await prisma.productVariant.update({
          where: { id: item.productVariantId },
          data: {
            stock: { increment: item.quantity }
          }
        });
      }
    }

    try {
      await emailNotificationService.sendOrderRefundNotification(updatedOrder, {
        refundAmount: refundAmount || order.totalAmount,
        reason,
        phonepeRefundId
      });
    } catch (emailError) {
      logger.error('Failed to send refund notification email:', emailError);
    }
    
    logger.info(`Order refunded: ${orderId}, PhonePe Refund ID: ${phonepeRefundId}`);
    return {
      ...updatedOrder,
      phonepeRefundId,
      refundAmount: refundAmount || order.totalAmount
    };
  }

  async getUserOrders(userId, { page, limit, status }) {
    const skip = (page - 1) * limit;
    
    const where = { userId };
    
    if (status) {
      where.status = status;
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  images: {
                    take: 1,
                    select: {
                      imageUrl: true
                    }
                  }
                }
              },
              productVariant: {
                include: {
                  variantImages: {
                    take: 1,
                    select: {
                      imageUrl: true,
                      color: true
                    }
                  }
                }
              }
            }
          },
          customImages: true, // Include custom images
          trackingHistory: {
            take: 3,
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.order.count({ where })
    ]);
    
    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      refundedOrders,
      totalRevenue,
      todayOrders,
      monthlyRevenue
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.count({ where: { status: 'REFUNDED' } }),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true
        },
        where: {
          status: { not: 'CANCELLED' },
          paymentStatus: 'PAID'
        }
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true
        },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          },
          status: { not: 'CANCELLED' },
          paymentStatus: 'PAID'
        }
      })
    ]);
    
    return {
      totalOrders,
      statusBreakdown: {
        PENDING: pendingOrders,
        CONFIRMED: confirmedOrders,
        PROCESSING: processingOrders,
        SHIPPED: shippedOrders,
        DELIVERED: deliveredOrders,
        CANCELLED: cancelledOrders,
        REFUNDED: refundedOrders
      },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        monthly: monthlyRevenue._sum.totalAmount || 0
      },
      todayOrders
    };
  }

  async checkPaymentStatus(merchantTransactionId) {
    try {
      const order = await prisma.order.findFirst({
        where: { phonepeMerchantTransactionId: merchantTransactionId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          phonepeResponseCode: true,
          phonepeResponseMessage: true,
          totalAmount: true
        }
      });
      
      if (!order) {
        throw new Error('Order not found for the given transaction ID');
      }

      // If payment is already successful, return order status
      if (order.paymentStatus === 'PAID') {
        return order;
      }

      // Check with PhonePe for latest status
      const phonepeStatus = await phonepeService.checkPaymentStatus(merchantTransactionId);
      
      if (phonepeStatus.success && phonepeStatus.code === 'PAYMENT_SUCCESS' && order.paymentStatus !== 'PAID') {
        // Update order status if payment was successful
        await this.handlePhonePeCallback({
          merchantTransactionId,
          transactionId: phonepeStatus.data.transactionId,
          code: phonepeStatus.code,
          message: phonepeStatus.message,
          paymentInstrument: phonepeStatus.data.paymentInstrument
        });

        // Fetch updated order
        const updatedOrder = await prisma.order.findFirst({
          where: { phonepeMerchantTransactionId: merchantTransactionId },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            phonepeResponseCode: true,
            phonepeResponseMessage: true,
            totalAmount: true
          }
        });

        return updatedOrder;
      }

      return order;
    } catch (error) {
      logger.error('Error checking payment status:', error);
      throw error;
    }
  }

  getStatusDescription(status) {
    const descriptions = {
      PENDING: 'Order has been placed and is awaiting confirmation',
      CONFIRMED: 'Order has been confirmed and is being processed',
      PROCESSING: 'Order is being prepared for shipment',
      SHIPPED: 'Order has been shipped',
      DELIVERED: 'Order has been delivered successfully',
      CANCELLED: 'Order has been cancelled',
      REFUNDED: 'Order has been refunded'
    };
    return descriptions[status] || 'Order status updated';
  }

  // Utility method to cancel expired pending orders
  async cancelExpiredPendingOrders() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        paymentStatus: 'PENDING',
        createdAt: { lt: twentyFourHoursAgo }
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                }
              }
            }
          }
        },
        customImages: true // Include custom images
      }
    });

    for (const order of expiredOrders) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'FAILED',
          phonepeResponseMessage: 'Payment not completed within 24 hours'
        }
      });

      await prisma.trackingHistory.create({
        data: {
          orderId: order.id,
          status: 'CANCELLED',
          description: 'Order automatically cancelled due to incomplete payment within 24 hours',
          location: 'System'
        }
      });

      logger.info(`Auto-cancelled expired order: ${order.orderNumber}`);
    }

    return {
      cancelledCount: expiredOrders.length,
      cancelledOrders: expiredOrders.map(order => order.orderNumber)
    };
  }

  async createCODOrder(orderData) {
    const {
      userId,
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      orderItems,
      couponCode,
      customImages = [] // Array of file objects or image data
    } = orderData;

    // Validate required fields
    if (!name || !email || !phone || !address || !city || !state || !pincode) {
      throw new Error('All shipping information fields are required');
    }

    // Calculate totals
    const totals = await this.calculateOrderTotals(orderItems, couponCode);

    // Process and upload custom images to S3
    let uploadedCustomImages = [];
    if (customImages.length > 0) {
      try {
        uploadedCustomImages = await CustomImageUploadService.processCustomImagesForOrder(
          customImages,
          userId
        );
      } catch (uploadError) {
        logger.error('Custom images upload failed for COD order', {
          userId,
          error: uploadError.message
        });
        throw new Error(`Custom images upload failed: ${uploadError.message}`);
      }
    }

    // Create order with COD status
    const order = await prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        userId,
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        status: 'CONFIRMED',
        totalAmount: totals.totalAmount,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shippingCost: totals.shippingCost,
        paymentStatus: 'PENDING',
        paymentMethod: 'COD',
        couponId: totals.coupon?.id || null,
        // Create custom image records with actual S3 URLs
        customImages: uploadedCustomImages.length > 0 ? {
          create: uploadedCustomImages.map(img => ({
            imageUrl: img.url,
            imageKey: img.key,
            filename: img.filename
          }))
        } : undefined,
        orderItems: {
          create: await Promise.all(
            orderItems.map(async (item) => {
              const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: {
                  normalPrice: true,
                  offerPrice: true,
                  name: true,
                  productCode: true
                }
              });

              const price = product.offerPrice || product.normalPrice;

              return {
                productId: item.productId,
                productVariantId: item.productVariantId || null,
                quantity: item.quantity,
                price: price
              };
            })
          )
        }
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  select: {
                    imageUrl: true
                  }
                }
              }
            },
            productVariant: {
              include: {
                variantImages: {
                  take: 1,
                  select: {
                    imageUrl: true,
                    color: true
                  }
                }
              }
            }
          }
        },
        customImages: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        coupon: true
      }
    });

    // Update stock for variants
    for (const item of orderItems) {
      if (item.productVariantId) {
        await prisma.productVariant.update({
          where: { id: item.productVariantId },
          data: {
            stock: { decrement: item.quantity }
          }
        });
      }
    }

    // Increment coupon usage
    if (totals.coupon) {
      await prisma.coupon.update({
        where: { id: totals.coupon.id },
        data: {
          usedCount: { increment: 1 }
        }
      });
    }

    // Create tracking history
    await prisma.trackingHistory.create({
      data: {
        orderId: order.id,
        status: 'CONFIRMED',
        description: 'COD order confirmed',
        location: `${order.city}, ${order.state}`
      }
    });

    // Send email notification
    try {
      await emailNotificationService.sendOrderNotifications(order);
    } catch (emailError) {
      logger.error('Failed to send COD order confirmation email:', emailError);
    }

    logger.info(`COD order created successfully with ${uploadedCustomImages.length} custom images: ${order.orderNumber}`);
    return order;
  }

}

export default new OrderService();