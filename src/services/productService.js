// services/productService.js
import prisma from '../config/database.js';
import s3UploadService from './s3UploadService.js';
import logger from '../utils/logger.js';

class ProductService {
  // Get all products with pagination and filtering
  async getAllProducts({ 
    page, 
    limit, 
    categoryId, 
    subcategoryId, 
    status,
    search,
    minPrice,
    maxPrice,
    includeVariants 
  }) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.OR = [
        {
          normalPrice: {
            gte: minPrice,
            lte: maxPrice
          }
        },
        {
          offerPrice: {
            gte: minPrice,
            lte: maxPrice
          }
        }
      ];
    }
    
    const include = {
      category: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      subcategory: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      images: {
        orderBy: {
          isPrimary: 'desc'
        }
      },
      ratings: {
        where: {
          isApproved: true
        },
        select: {
          rating: true,
          review: true
        }
      }
    };
    
    if (includeVariants) {
      include.variants = {
        include: {
          variantImages: {
            orderBy: {
              isPrimary: 'desc'
            }
          }
        }
      };
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.product.count({ where })
    ]);
    
    // Calculate average ratings
    const productsWithAvgRating = products.map(product => {
      const ratings = product.ratings;
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
        : 0;
      
      return {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings: ratings.length
      };
    });
    
    return {
      products: productsWithAvgRating,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  // Get product by ID
  async getProductById(productId, includeVariants = false) {
    const include = {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      subcategory: {
        select: {
          id: true,
          name: true
        }
      },
      images: {
        orderBy: {
          isPrimary: 'desc'
        }
      },
      ratings: {
        where: {
          isApproved: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    };
    
    if (includeVariants) {
      include.variants = {
        include: {
          variantImages: {
            orderBy: {
              isPrimary: 'desc'
            }
          }
        }
      };
    }
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Calculate average rating
    const ratings = product.ratings;
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0;
    
    return {
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratings.length
    };
  }
  
  // Get product by product code
  async getProductByCode(productCode, includeVariants = false) {
    const include = {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      subcategory: {
        select: {
          id: true,
          name: true
        }
      },
      images: {
        orderBy: {
          isPrimary: 'desc'
        }
      },
      ratings: {
        where: {
          isApproved: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }
    };
    
    if (includeVariants) {
      include.variants = {
        include: {
          variantImages: {
            orderBy: {
              isPrimary: 'desc'
            }
          }
        }
      };
    }
    
    const product = await prisma.product.findUnique({
      where: { productCode },
      include
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Calculate average rating
    const ratings = product.ratings;
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0;
    
    return {
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratings.length
    };
  }
  
  // Create product
  async createProduct(productData, files = []) {
    const {
      name,
      productCode,
      description,
      normalPrice,
      offerPrice,
      wholesalePrice,
      categoryId,
      subcategoryId,
      details,
      variants = []
    } = productData;
    
    // Check if product code already exists
    const existingProduct = await prisma.product.findUnique({
      where: { productCode }
    });
    
    if (existingProduct) {
      throw new Error('Product code already exists');
    }
    
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    // Check if subcategory exists and belongs to category
    if (subcategoryId) {
      const subcategory = await prisma.subcategory.findUnique({
        where: { id: subcategoryId }
      });
      
      if (!subcategory) {
        throw new Error('Subcategory not found');
      }
      
      if (subcategory.categoryId !== categoryId) {
        throw new Error('Subcategory does not belong to the specified category');
      }
    }
    
    // Upload product images
    let productImages = [];
    if (files.length > 0) {
      try {
        const uploadResults = await s3UploadService.uploadMultipleProductImages(
          files
        );
        productImages = uploadResults.map((result, index) => ({
          imageUrl: result.url,
          imagePublicId: result.key,
          isPrimary: index === 0 // First image is primary by default
        }));
      } catch (uploadError) {
        logger.error('Failed to upload product images:', uploadError);
        throw new Error('Failed to upload product images');
      }
    }
    
    // Prepare variants data
    const variantsData = variants.map((variant, index) => {
      const sku = variant.sku || `${productCode}-${variant.color}-${variant.size}`;
      return {
        color: variant.color,
        size: variant.size,
        stock: parseInt(variant.stock) || 0,
        sku,
        variantImages: {
          create: [] // Variant images will be added separately
        }
      };
    });
    
    const product = await prisma.product.create({
      data: {
        name,
        productCode,
        description,
        normalPrice: parseFloat(normalPrice),
        offerPrice: offerPrice ? parseFloat(offerPrice) : null,
        wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
        categoryId,
        subcategoryId: subcategoryId || null,
        details: details || {},
        images: {
          create: productImages
        },
        variants: {
          create: variantsData
        }
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true
          }
        },
        images: true,
        variants: {
          include: {
            variantImages: true
          }
        }
      }
    });
    
    logger.info(`Product created: ${product.id}`);
    return product;
  }
  
  // Update product
  async updateProduct(productId, updateData, files = []) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true
      }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    const {
      name,
      description,
      normalPrice,
      offerPrice,
      wholesalePrice,
      categoryId,
      subcategoryId,
      details,
      status
    } = updateData;
    
    // Check if category exists if being updated
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      
      if (!category) {
        throw new Error('Category not found');
      }
    }
    
    // Check if subcategory exists if being updated
    if (subcategoryId) {
      const subcategory = await prisma.subcategory.findUnique({
        where: { id: subcategoryId }
      });
      
      if (!subcategory) {
        throw new Error('Subcategory not found');
      }
    }
    
    // Upload new product images if provided
    let newImages = [];
    if (files.length > 0) {
      try {
        const uploadResults = await s3UploadService.uploadMultipleProductImages(
          files,
          productId
        );
        newImages = uploadResults.map(result => ({
          imageUrl: result.url,
          imagePublicId: result.key,
          isPrimary: false
        }));
      } catch (uploadError) {
        logger.error('Failed to upload product images:', uploadError);
        throw new Error('Failed to upload product images');
      }
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        normalPrice: normalPrice ? parseFloat(normalPrice) : product.normalPrice,
        offerPrice: offerPrice !== undefined ? parseFloat(offerPrice) : product.offerPrice,
        wholesalePrice: wholesalePrice !== undefined ? parseFloat(wholesalePrice) : product.wholesalePrice,
        categoryId: categoryId || product.categoryId,
        subcategoryId: subcategoryId !== undefined ? subcategoryId : product.subcategoryId,
        details: details || product.details,
        status: status || product.status,
        updatedAt: new Date(),
        ...(newImages.length > 0 && {
          images: {
            create: newImages
          }
        })
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true
          }
        },
        images: {
          orderBy: {
            isPrimary: 'desc'
          }
        },
        variants: {
          include: {
            variantImages: {
              orderBy: {
                isPrimary: 'desc'
              }
            }
          }
        }
      }
    });
    
    logger.info(`Product updated: ${productId}`);
    return updatedProduct;
  }
  
  // Delete product
  async deleteProduct(productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        variants: {
          include: {
            variantImages: true
          }
        },
        orderItems: true,
        ratings: true
      }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Check if product has orders
    if (product.orderItems.length > 0) {
      throw new Error('Cannot delete product with existing orders');
    }
    
    // Delete product images from S3
    for (const image of product.images) {
      if (image.imagePublicId) {
        try {
          await s3UploadService.deleteImage(image.imagePublicId);
        } catch (error) {
          logger.error('Failed to delete product image from S3:', error);
        }
      }
    }
    
    // Delete variant images from S3
    for (const variant of product.variants) {
      for (const variantImage of variant.variantImages) {
        if (variantImage.imagePublicId) {
          try {
            await s3UploadService.deleteImage(variantImage.imagePublicId);
          } catch (error) {
            logger.error('Failed to delete variant image from S3:', error);
          }
        }
      }
    }
    
    await prisma.product.delete({
      where: { id: productId }
    });
    
    logger.info(`Product deleted: ${productId}`);
  }
  
  // Toggle product status
  async toggleProductStatus(productId, status) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    const validStatuses = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid product status');
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        subcategory: {
          select: {
            id: true,
            name: true
          }
        },
        images: {
          orderBy: {
            isPrimary: 'desc'
          }
        }
      }
    });
    
    logger.info(`Product status updated: ${productId} -> ${status}`);
    return updatedProduct;
  }
  
  // Add product images
  async addProductImages(productId, files) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    let newImages = [];
    if (files.length > 0) {
      try {
        const uploadResults = await s3UploadService.uploadMultipleProductImages(
          files,
          productId
        );
        newImages = uploadResults.map(result => ({
          imageUrl: result.url,
          imagePublicId: result.key,
          isPrimary: false
        }));
      } catch (uploadError) {
        logger.error('Failed to upload product images:', uploadError);
        throw new Error('Failed to upload product images');
      }
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        images: {
          create: newImages
        },
        updatedAt: new Date()
      },
      include: {
        images: {
          orderBy: {
            isPrimary: 'desc'
          }
        }
      }
    });
    
    logger.info(`Product images added: ${productId}, count: ${newImages.length}`);
    return updatedProduct;
  }
  
  // Remove product image
  async removeProductImage(productId, imageId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true
      }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    const image = product.images.find(img => img.id === imageId);
    if (!image) {
      throw new Error('Product image not found');
    }
    
    // Delete image from S3
    if (image.imagePublicId) {
      try {
        await s3UploadService.deleteImage(image.imagePublicId);
      } catch (error) {
        logger.error('Failed to delete product image from S3:', error);
        throw new Error('Failed to remove product image');
      }
    }
    
    // If this was the primary image, set another image as primary
    let setNewPrimary = false;
    if (image.isPrimary && product.images.length > 1) {
      setNewPrimary = true;
    }
    
    // Delete the image
    await prisma.productImage.delete({
      where: { id: imageId }
    });
    
    // Set new primary image if needed
    if (setNewPrimary) {
      const remainingImages = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { createdAt: 'asc' }
      });
      
      if (remainingImages.length > 0) {
        await prisma.productImage.update({
          where: { id: remainingImages[0].id },
          data: { isPrimary: true }
        });
      }
    }
    
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: {
            isPrimary: 'desc'
          }
        }
      }
    });
    
    logger.info(`Product image removed: ${productId}, imageId: ${imageId}`);
    return updatedProduct;
  }
  
  // Set primary product image
  async setPrimaryProductImage(productId, imageId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true
      }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    const image = product.images.find(img => img.id === imageId);
    if (!image) {
      throw new Error('Product image not found');
    }
    
    // Reset all images to non-primary
    await prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false }
    });
    
    // Set the selected image as primary
    await prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true }
    });
    
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: {
            isPrimary: 'desc'
          }
        }
      }
    });
    
    logger.info(`Primary product image set: ${productId}, imageId: ${imageId}`);
    return updatedProduct;
  }
  
  // Add product variant
  async addProductVariant(productId, variantData, files = []) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    const { color, size, stock = 0, sku } = variantData;
    
    // Check if variant with same color and size already exists
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        productId,
        color,
        size
      }
    });
    
    if (existingVariant) {
      throw new Error('Variant with same color and size already exists');
    }
    
    // Check if SKU already exists
    if (sku) {
      const existingSku = await prisma.productVariant.findFirst({
        where: {
          sku,
          productId: { not: productId }
        }
      });
      
      if (existingSku) {
        throw new Error('SKU already exists');
      }
    }
    
    const generatedSku = sku || `${product.productCode}-${color}-${size}`;
    
    // Upload variant images if provided
    let variantImages = [];
    if (files.length > 0) {
      try {
        const uploadResults = await s3UploadService.uploadMultipleImages(
          files,
          `products/${productId}/variants`
        );
        variantImages = uploadResults.map((result, index) => ({
          imageUrl: result.url,
          imagePublicId: result.key,
          isPrimary: index === 0,
          color
        }));
      } catch (uploadError) {
        logger.error('Failed to upload variant images:', uploadError);
        throw new Error('Failed to upload variant images');
      }
    }
    
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        color,
        size,
        stock: parseInt(stock),
        sku: generatedSku,
        variantImages: {
          create: variantImages
        }
      },
      include: {
        variantImages: {
          orderBy: {
            isPrimary: 'desc'
          }
        }
      }
    });
    
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            variantImages: {
              orderBy: {
                isPrimary: 'desc'
              }
            }
          }
        }
      }
    });
    
    logger.info(`Product variant added: ${productId}, variantId: ${variant.id}`);
    return updatedProduct;
  }
  
  // Update product variant
  async updateProductVariant(productId, variantId, variantData, files = []) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        variantImages: true
      }
    });
    
    if (!variant || variant.productId !== productId) {
      throw new Error('Product variant not found');
    }
    
    const { color, size, stock, sku } = variantData;
    
    // Check if variant with same color and size already exists (excluding current variant)
    if (color && size && (color !== variant.color || size !== variant.size)) {
      const existingVariant = await prisma.productVariant.findFirst({
        where: {
          productId,
          color,
          size,
          id: { not: variantId }
        }
      });
      
      if (existingVariant) {
        throw new Error('Variant with same color and size already exists');
      }
    }
    
    // Check if SKU already exists (excluding current variant)
    if (sku && sku !== variant.sku) {
      const existingSku = await prisma.productVariant.findFirst({
        where: {
          sku,
          id: { not: variantId }
        }
      });
      
      if (existingSku) {
        throw new Error('SKU already exists');
      }
    }
    
    // Upload new variant images if provided
    let newVariantImages = [];
    if (files.length > 0) {
      try {
        const uploadResults = await s3UploadService.uploadMultipleImages(
          files,
          `products/${productId}/variants`
        );
        newVariantImages = uploadResults.map(result => ({
          imageUrl: result.url,
          imagePublicId: result.key,
          isPrimary: false,
          color: color || variant.color
        }));
      } catch (uploadError) {
        logger.error('Failed to upload variant images:', uploadError);
        throw new Error('Failed to upload variant images');
      }
    }
    
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        color: color || variant.color,
        size: size || variant.size,
        stock: stock !== undefined ? parseInt(stock) : variant.stock,
        sku: sku || variant.sku,
        updatedAt: new Date(),
        ...(newVariantImages.length > 0 && {
          variantImages: {
            create: newVariantImages
          }
        })
      },
      include: {
        variantImages: {
          orderBy: {
            isPrimary: 'desc'
          }
        }
      }
    });
    
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            variantImages: {
              orderBy: {
                isPrimary: 'desc'
              }
            }
          }
        }
      }
    });
    
    logger.info(`Product variant updated: ${productId}, variantId: ${variantId}`);
    return updatedProduct;
  }
  
  // Remove product variant
  async removeProductVariant(productId, variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        variantImages: true,
        orderItems: true
      }
    });
    
    if (!variant || variant.productId !== productId) {
      throw new Error('Product variant not found');
    }
    
    // Check if variant has orders
    if (variant.orderItems.length > 0) {
      throw new Error('Cannot delete variant with existing orders');
    }
    
    // Delete variant images from S3
    for (const variantImage of variant.variantImages) {
      if (variantImage.imagePublicId) {
        try {
          await s3UploadService.deleteImage(variantImage.imagePublicId);
        } catch (error) {
          logger.error('Failed to delete variant image from S3:', error);
        }
      }
    }
    
    await prisma.productVariant.delete({
      where: { id: variantId }
    });
    
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            variantImages: {
              orderBy: {
                isPrimary: 'desc'
              }
            }
          }
        }
      }
    });
    
    logger.info(`Product variant removed: ${productId}, variantId: ${variantId}`);
    return updatedProduct;
  }
  
  // Add variant images
  async addVariantImages(productId, variantId, files) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId }
    });
    
    if (!variant || variant.productId !== productId) {
      throw new Error('Product variant not found');
    }
    
    let newVariantImages = [];
    if (files.length > 0) {
      try {
        const uploadResults = await s3UploadService.uploadMultipleImages(
          files,
          `products/${productId}/variants`
        );
        newVariantImages = uploadResults.map(result => ({
          imageUrl: result.url,
          imagePublicId: result.key,
          isPrimary: false,
          color: variant.color
        }));
      } catch (uploadError) {
        logger.error('Failed to upload variant images:', uploadError);
        throw new Error('Failed to upload variant images');
      }
    }
    
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        variantImages: {
          create: newVariantImages
        },
        updatedAt: new Date()
      },
      include: {
        variantImages: {
          orderBy: {
            isPrimary: 'desc'
          }
        }
      }
    });
    
    logger.info(`Variant images added: ${variantId}, count: ${newVariantImages.length}`);
    return updatedVariant;
  }
  
  // Remove variant image
  async removeVariantImage(productId, variantId, imageId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        variantImages: true
      }
    });
    
    if (!variant || variant.productId !== productId) {
      throw new Error('Product variant not found');
    }
    
    const variantImage = variant.variantImages.find(img => img.id === imageId);
    if (!variantImage) {
      throw new Error('Variant image not found');
    }
    
    // Delete image from S3
    if (variantImage.imagePublicId) {
      try {
        await s3UploadService.deleteImage(variantImage.imagePublicId);
      } catch (error) {
        logger.error('Failed to delete variant image from S3:', error);
        throw new Error('Failed to remove variant image');
      }
    }
    
    // If this was the primary image, set another image as primary
    let setNewPrimary = false;
    if (variantImage.isPrimary && variant.variantImages.length > 1) {
      setNewPrimary = true;
    }
    
    // Delete the image
    await prisma.productVariantImage.delete({
      where: { id: imageId }
    });
    
    // Set new primary image if needed
    if (setNewPrimary) {
      const remainingImages = await prisma.productVariantImage.findMany({
        where: { variantId },
        orderBy: { createdAt: 'asc' }
      });
      
      if (remainingImages.length > 0) {
        await prisma.productVariantImage.update({
          where: { id: remainingImages[0].id },
          data: { isPrimary: true }
        });
      }
    }
    
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        variantImages: {
          orderBy: {
            isPrimary: 'desc'
          }
        }
      }
    });
    
    logger.info(`Variant image removed: ${variantId}, imageId: ${imageId}`);
    return updatedVariant;
  }
  
  // Set primary variant image
  async setPrimaryVariantImage(productId, variantId, imageId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        variantImages: true
      }
    });
    
    if (!variant || variant.productId !== productId) {
      throw new Error('Product variant not found');
    }
    
    const variantImage = variant.variantImages.find(img => img.id === imageId);
    if (!variantImage) {
      throw new Error('Variant image not found');
    }
    
    // Reset all variant images to non-primary
    await prisma.productVariantImage.updateMany({
      where: { variantId },
      data: { isPrimary: false }
    });
    
    // Set the selected image as primary
    await prisma.productVariantImage.update({
      where: { id: imageId },
      data: { isPrimary: true }
    });
    
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        variantImages: {
          orderBy: {
            isPrimary: 'desc'
          }
        }
      }
    });
    
    logger.info(`Primary variant image set: ${variantId}, imageId: ${imageId}`);
    return updatedVariant;
  }
  
  // Update variant stock
  async updateVariantStock(productId, variantId, stock) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId }
    });
    
    if (!variant || variant.productId !== productId) {
      throw new Error('Product variant not found');
    }
    
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        stock: parseInt(stock),
        updatedAt: new Date()
      }
    });
    
    logger.info(`Variant stock updated: ${variantId}, stock: ${stock}`);
    return updatedVariant;
  }
  
  // Get product statistics
  async getProductStats() {
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      productsWithVariants,
      totalVariants,
      lowStockVariants,
      categoriesWithProducts,
      averagePrice
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { status: 'OUT_OF_STOCK' } }),
      prisma.product.count({
        where: {
          variants: {
            some: {}
          }
        }
      }),
      prisma.productVariant.count(),
      prisma.productVariant.count({ where: { stock: { lt: 10 } } }),
      prisma.category.count({
        where: {
          products: {
            some: {
              status: 'ACTIVE'
            }
          }
        }
      }),
      prisma.product.aggregate({
        where: { status: 'ACTIVE' },
        _avg: {
          normalPrice: true
        }
      })
    ]);
    
    return {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts - outOfStockProducts,
      outOfStockProducts,
      productsWithVariants,
      totalVariants,
      lowStockVariants,
      categoriesWithProducts,
      averagePrice: averagePrice._avg.normalPrice || 0
    };
  }
  
  // Search products
  async searchProducts({
    query,
    categoryId,
    subcategoryId,
    minPrice,
    maxPrice,
    colors,
    sizes,
    page,
    limit
  }) {
    const skip = (page - 1) * limit;
    
    const where = {
      status: 'ACTIVE'
    };
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { productCode: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (subcategoryId) {
      where.subcategoryId = subcategoryId;
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.OR = [
        {
          normalPrice: {
            gte: minPrice,
            lte: maxPrice
          }
        },
        {
          offerPrice: {
            gte: minPrice,
            lte: maxPrice
          }
        }
      ];
    }
    
    // Filter by variants (color and size)
    if (colors.length > 0 || sizes.length > 0) {
      where.variants = {
        some: {
          ...(colors.length > 0 && { color: { in: colors } }),
          ...(sizes.length > 0 && { size: { in: sizes } })
        }
      };
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          subcategory: {
            select: {
              id: true,
              name: true
            }
          },
          images: {
            where: { isPrimary: true },
            take: 1
          },
          variants: {
            select: {
              color: true,
              size: true,
              stock: true
            }
          },
          ratings: {
            where: {
              isApproved: true
            },
            select: {
              rating: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.product.count({ where })
    ]);
    
    // Calculate average ratings and get available colors and sizes
    const productsWithDetails = products.map(product => {
      const ratings = product.ratings;
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
        : 0;
      
      // Get unique colors and sizes from variants
      const availableColors = [...new Set(product.variants.map(v => v.color))];
      const availableSizes = [...new Set(product.variants.map(v => v.size))];
      const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      
      return {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings: ratings.length,
        availableColors,
        availableSizes,
        totalStock
      };
    });
    
    // Get available filters
    const availableColors = await prisma.productVariant.findMany({
      where: {
        product: {
          status: 'ACTIVE',
          ...(categoryId && { categoryId }),
          ...(subcategoryId && { subcategoryId })
        }
      },
      distinct: ['color'],
      select: {
        color: true
      }
    });
    
    const availableSizes = await prisma.productVariant.findMany({
      where: {
        product: {
          status: 'ACTIVE',
          ...(categoryId && { categoryId }),
          ...(subcategoryId && { subcategoryId })
        }
      },
      distinct: ['size'],
      select: {
        size: true
      }
    });
    
    return {
      products: productsWithDetails,
      filters: {
        colors: availableColors.map(c => c.color),
        sizes: availableSizes.map(s => s.size)
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

export default new ProductService();