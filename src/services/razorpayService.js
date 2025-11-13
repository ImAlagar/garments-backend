import Razorpay from 'razorpay';
import logger from '../utils/logger.js';

class RazorpayService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  async createOrder(amount, currency = 'INR', receipt = null) {
    try {
      const options = {
        amount: amount * 100,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        payment_capture: 1
      };

      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      logger.error('Razorpay order creation failed:', error);
      throw new Error('Payment gateway error: ' + error.message);
    }
  }

  verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature) {
    const crypto = require('crypto');
    
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    return generated_signature === razorpay_signature;
  }

  async processRefund(paymentId, amount) {
    try {
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: amount * 100
      });
      return refund;
    } catch (error) {
      logger.error('Razorpay refund failed:', error);
      throw new Error('Refund processing failed: ' + error.message);
    }
  }

  async getPaymentDetails(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      logger.error('Failed to fetch payment details:', error);
      throw new Error('Failed to fetch payment details: ' + error.message);
    }
  }
}

export default new RazorpayService();