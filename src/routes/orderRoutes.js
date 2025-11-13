import express from 'express';
import {
  initiatePayment,
  handlePaymentCallback,
  checkPaymentStatus,
  getAllOrders,
  getOrderById,
  getOrderByOrderNumber,
  updateOrderStatus,
  updateTrackingInfo,
  processRefund,
  getUserOrders,
  getOrderStats,
  calculateOrderTotals,
  createCODOrder,
  testPhonePeIntegration
} from '../controllers/orderController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/calculate-totals', calculateOrderTotals);

// PhonePe Payment Routes
router.post('/initiate-payment', auth, initiatePayment);
router.post('/payment-callback', handlePaymentCallback);
router.post('/create-cod-order', auth, createCODOrder);
router.get('/payment-status/:merchantTransactionId', checkPaymentStatus);

// User Routes
router.get('/user/my-orders', auth, getUserOrders);
router.get('/order-number/:orderNumber', getOrderByOrderNumber);

// Admin Routes
router.get('/admin', auth, authorize('ADMIN'), getAllOrders);
router.get('/admin/stats', auth, authorize('ADMIN'), getOrderStats);
router.get('/admin/:orderId', auth, authorize('ADMIN'), getOrderById);
router.patch('/admin/:orderId/status', auth, authorize('ADMIN'), updateOrderStatus);
router.patch('/admin/:orderId/tracking', auth, authorize('ADMIN'), updateTrackingInfo);
router.post('/admin/:orderId/refund', auth, authorize('ADMIN'), processRefund);

// Add to routes
router.get('/test-phonepe-integration', testPhonePeIntegration);

export default router;