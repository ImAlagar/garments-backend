// routes/subcategoryRoutes.js
import express from 'express';
import {
  getAllSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  toggleSubcategoryStatus
} from '../controllers/subcategoryController.js';
import { auth, authorize } from '../middleware/auth.js';
import multer from 'multer';

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
router.get('/', getAllSubcategories);
router.get('/:subcategoryId', getSubcategoryById);

// Admin only routes
router.post('/admin', auth, authorize('ADMIN'), upload.single('image'), createSubcategory);
router.put('/admin/:subcategoryId', auth, authorize('ADMIN'), upload.single('image'), updateSubcategory);
router.delete('/admin/:subcategoryId', auth, authorize('ADMIN'), deleteSubcategory);
router.patch('/admin/:subcategoryId/status', auth, authorize('ADMIN'), toggleSubcategoryStatus);

export default router;