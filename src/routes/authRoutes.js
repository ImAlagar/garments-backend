import express from 'express';
import { 
  register, 
  login, 
  logout, 
  forgotPassword, 
  resetPassword,
  getProfile,
  verifyOTP,
  resendOTP,
  approveWholesaler,
  getPendingWholesalers
} from '../controllers/authController.js';
import { auth, authorize } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Public routes
router.post('/register', upload.array('shopPhotos', 5), register);
router.post('/login', login); // Single smart login endpoint
router.post('/verify-otp', verifyOTP); // Unified OTP verification
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', auth, logout);
router.get('/profile', auth, getProfile);

// Admin routes
router.get('/admin/pending-wholesalers', auth, authorize('ADMIN'), getPendingWholesalers);
router.patch('/admin/approve-wholesaler/:wholesalerId', auth, authorize('ADMIN'), approveWholesaler);

export default router;