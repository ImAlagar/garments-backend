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
  searchProducts,
  addProductDetails,
  updateProductDetail,
  removeProductDetail,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  toggleBestSeller,
  toggleNewArrival,
  toggleFeatured,
  autoUpdateMerchandising
} from '../controllers/productController.js';
import multer from 'multer';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 50 // Maximum 50 files total
    },
    fileFilter: (req, file, cb) => {
        // Allow any fieldname that starts with 'variantImages'
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Only images are allowed.`), false);
        }
    }
});

// SIMPLE APPROACH: Use .any() to accept all files
const handleVariantImagesUpload = upload.any();
// Public routes
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/code/:productCode', getProductByCode);
router.get('/:productId', getProductById);

// Public routes for merchandising
router.get('/featured/products', getFeaturedProducts);
router.get('/new-arrivals/products', getNewArrivals);
router.get('/best-sellers/products', getBestSellers);


// Admin routes (without auth for testing)
router.get('/admin/stats', getProductStats);
router.post('/admin', (req, res, next) => {
    handleVariantImagesUpload(req, res, (err) => {
        if (err) {
            console.error('File upload error:', err);
            return res.status(400).json({
                success: false,
                message: `File upload failed: ${err.message}`
            });
        }
        
        // Log uploaded files for debugging
        if (req.files && req.files.length > 0) {
            console.log('=== UPLOADED FILES DEBUG ===');
            console.log('Total files uploaded:', req.files.length);
            req.files.forEach((file, index) => {
                console.log(`File ${index}:`, {
                    fieldname: file.fieldname,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                });
            });
        } else {
            console.log('No files uploaded');
        }
        
        next();
    });
}, createProduct);
router.put('/admin/:productId', upload.array('images', 10), updateProduct);
router.delete('/admin/:productId', deleteProduct);
router.patch('/admin/:productId/status', toggleProductStatus);
// Admin routes for merchandising management
router.patch('/admin/:productId/best-seller', toggleBestSeller);
router.patch('/admin/:productId/new-arrival', toggleNewArrival);
router.patch('/admin/:productId/featured', toggleFeatured);
router.post('/admin/merchandising/auto-update', autoUpdateMerchandising);


// Product details routes (without auth for testing)
router.post('/admin/:productId/details', addProductDetails);
router.put('/admin/:productId/details/:detailId', updateProductDetail);
router.delete('/admin/:productId/details/:detailId', removeProductDetail);

// Product images routes (without auth for testing)
router.post('/admin/:productId/images', upload.array('images', 10), addProductImages);
router.delete('/admin/:productId/images/:imageId', removeProductImage);
router.patch('/admin/:productId/images/:imageId/primary', setPrimaryProductImage);

// Product variants routes (without auth for testing)
router.post('/admin/:productId/variants', upload.array('images', 10), addProductVariant);
router.put('/admin/:productId/variants/:variantId', upload.array('images', 10), updateProductVariant);
router.delete('/admin/:productId/variants/:variantId', removeProductVariant);
router.patch('/admin/:productId/variants/:variantId/stock', updateVariantStock);

// Variant images routes (without auth for testing)
router.post('/admin/:productId/variants/:variantId/images', upload.array('images', 10), addVariantImages);
router.delete('/admin/:productId/variants/:variantId/images/:imageId', removeVariantImage);
router.patch('/admin/:productId/variants/:variantId/images/:imageId/primary', setPrimaryVariantImage);

export default router;