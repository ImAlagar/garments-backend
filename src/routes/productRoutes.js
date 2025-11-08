// routes/productRoutes.js
import express from 'express';
import {
  getAllProducts,
  getProductById,
  getProductByCode,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  addProductImages,
  removeProductImage,
  setPrimaryProductImage,
  addProductVariant,
  updateProductVariant,
  removeProductVariant,
  addVariantImages,
  removeVariantImage,
  setPrimaryVariantImage,
  updateVariantStock,
  getProductStats,
  searchProducts
} from '../controllers/productController.js';
import { auth, authorize } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
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
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/code/:productCode', getProductByCode);
router.get('/:productId', getProductById);

// Admin only routes
router.get('/admin/stats', auth, authorize('ADMIN'), getProductStats);
router.post('/admin', auth, authorize('ADMIN'), upload.array('images', 10), createProduct);
router.put('/admin/:productId', auth, authorize('ADMIN'), upload.array('images', 10), updateProduct);
router.delete('/admin/:productId', auth, authorize('ADMIN'), deleteProduct);
router.patch('/admin/:productId/status', auth, authorize('ADMIN'), toggleProductStatus);

// Product images routes (Admin only)
router.post('/admin/:productId/images', auth, authorize('ADMIN'), upload.array('images', 10), addProductImages);
router.delete('/admin/:productId/images/:imageId', auth, authorize('ADMIN'), removeProductImage);
router.patch('/admin/:productId/images/:imageId/primary', auth, authorize('ADMIN'), setPrimaryProductImage);

// Product variants routes (Admin only)
router.post('/admin/:productId/variants', auth, authorize('ADMIN'), upload.array('images', 10), addProductVariant);
router.put('/admin/:productId/variants/:variantId', auth, authorize('ADMIN'), upload.array('images', 10), updateProductVariant);
router.delete('/admin/:productId/variants/:variantId', auth, authorize('ADMIN'), removeProductVariant);
router.patch('/admin/:productId/variants/:variantId/stock', auth, authorize('ADMIN'), updateVariantStock);

// Variant images routes (Admin only)
router.post('/admin/:productId/variants/:variantId/images', auth, authorize('ADMIN'), upload.array('images', 10), addVariantImages);
router.delete('/admin/:productId/variants/:variantId/images/:imageId', auth, authorize('ADMIN'), removeVariantImage);
router.patch('/admin/:productId/variants/:variantId/images/:imageId/primary', auth, authorize('ADMIN'), setPrimaryVariantImage);

export default router;