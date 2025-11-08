// routes/index.js
import express from 'express';
const router = express.Router();

import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import subcategoryRoutes from './subcategoryRoutes.js';
import productRoutes from './productRoutes.js';

router.use('/auth', authRoutes);
router.use('/auth', userRoutes);
router.use('/category', categoryRoutes);
router.use('/subcategory', subcategoryRoutes);
router.use('/product', productRoutes);

export default router;