import express from 'express';
const router = express.Router();

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import subcategoryRoutes from './subcategoryRoutes.js';
import productRoutes from './productRoutes.js';
import contactRoutes from './contactRoutes.js'; // Add this line
import couponRoutes from './couponRoutes.js';
import ratingRoutes from './ratingRoutes.js'; // Add this line
import orderRoutes from './orderRoutes.js'; // Add this line
import sliderRoutes from './sliderRoutes.js';


router.use('/auth', authRoutes);
router.use('/auth', userRoutes);
router.use('/category', categoryRoutes);
router.use('/subcategory', subcategoryRoutes);
router.use('/products', productRoutes);
router.use('/contacts', contactRoutes); // Add this line
router.use('/coupons', couponRoutes);
router.use('/ratings', ratingRoutes); // Add this line
router.use('/orders', orderRoutes); // Add this line
router.use('/sliders', sliderRoutes);

export default router;