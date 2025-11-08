import express from 'express';
import { 
  register, 
  login, 
  logout, 
  forgotPassword, 
  resetPassword,
  getProfile,
  verifyLoginOTP,
  resendOTP,
  approveWholesaler,
  getPendingWholesalers
} from '../controllers/authController.js';
import { auth, authorize } from '../middleware/auth.js';
import multer from 'multer';
import { deleteShopPhoto, getShopPhotos, uploadShopPhotos } from '../controllers/wholesalerController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.post('/register', upload.array('shopPhotos', 5), register); // Max 5 photos

router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (all users)
router.post('/logout', auth, logout);
router.get('/profile', auth, getProfile);

// Admin only routes
router.get('/admin/pending-wholesalers', auth, authorize('ADMIN'), getPendingWholesalers);
router.patch('/admin/approve-wholesaler/:wholesalerId', auth, authorize('ADMIN'), approveWholesaler);


// Wholesaler photo management routes
router.post('/wholesaler/:wholesalerId/shop-photos', auth, authorize('WHOLESALER'), upload.array('photos', 5), uploadShopPhotos);
router.get('/wholesaler/:wholesalerId/shop-photos', auth, getShopPhotos);
router.delete('/wholesaler/:wholesalerId/shop-photos/:photoKey', auth, authorize('WHOLESALER'), deleteShopPhoto);

export default router;