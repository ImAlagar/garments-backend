// routes/sliderRoutes.js
import express from 'express';
import {
  getActiveSliders,
  getAllSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
  toggleSliderStatus,
  reorderSliders,
  getSliderStats,          // Add this import
  getSliderPerformance     // Add this import
} from '../controllers/sliderController.js';
import { auth, authorize } from '../middleware/auth.js';
import { validateSlider } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveSliders);

// Admin only routes
router.get('/', auth, authorize('ADMIN'), getAllSliders);
router.get('/stats', auth, authorize('ADMIN'), getSliderStats);           // Add stats route
router.get('/performance', auth, authorize('ADMIN'), getSliderPerformance); // Add performance route
router.get('/:sliderId', auth, authorize('ADMIN'), getSliderById);
router.post('/', auth, authorize('ADMIN'), validateSlider, createSlider);
router.put('/:sliderId', auth, authorize('ADMIN'), validateSlider, updateSlider);
router.delete('/:sliderId', auth, authorize('ADMIN'), deleteSlider);
router.patch('/:sliderId/status', auth, authorize('ADMIN'), toggleSliderStatus);
router.patch('/reorder', auth, authorize('ADMIN'), reorderSliders);

export default router;