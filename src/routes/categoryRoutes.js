// routes/categoryRoutes.js
import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryStats,
  updateCategoryImage,
  removeCategoryImage
} from '../controllers/categoryController.js';
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
router.get('/', getAllCategories);
router.get('/:categoryId', getCategoryById);

// Admin only routes
router.get('/admin/stats', auth, authorize('ADMIN'), getCategoryStats);
router.post('/admin', auth, authorize('ADMIN'), upload.single('image'), createCategory);
router.put('/admin/:categoryId', auth, authorize('ADMIN'), upload.single('image'), updateCategory);
router.delete('/admin/:categoryId', auth, authorize('ADMIN'), deleteCategory);
router.patch('/admin/:categoryId/status', auth, authorize('ADMIN'), toggleCategoryStatus);
router.patch('/admin/:categoryId/image', auth, authorize('ADMIN'), upload.single('image'), updateCategoryImage);
router.delete('/admin/:categoryId/image', auth, authorize('ADMIN'), removeCategoryImage);

export default router;