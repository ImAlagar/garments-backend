// controllers/sliderController.js
import { sliderService } from '../services/index.js';
import { asyncHandler } from '../utils/helpers.js';

// Get active sliders for home page (Public)
export const getActiveSliders = asyncHandler(async (req, res) => {
  const sliders = await sliderService.getActiveSliders();
  
  res.status(200).json({
    success: true,
    data: sliders
  });
});

// Get all sliders (Admin only)
export const getAllSliders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, isActive } = req.query;
  
  const result = await sliderService.getAllSliders({
    page: parseInt(page),
    limit: parseInt(limit),
    isActive
  });
  
  res.status(200).json({
    success: true,
    data: result
  });
});

// Get slider by ID
export const getSliderById = asyncHandler(async (req, res) => {
  const { sliderId } = req.params;
  
  const slider = await sliderService.getSliderById(sliderId);
  
  res.status(200).json({
    success: true,
    data: slider
  });
});

// Create slider (Admin only)
export const createSlider = asyncHandler(async (req, res) => {
  const sliderData = req.body;
  
  const slider = await sliderService.createSlider(sliderData);
  
  res.status(201).json({
    success: true,
    message: 'Slider created successfully',
    data: slider
  });
});

// Update slider (Admin only)
export const updateSlider = asyncHandler(async (req, res) => {
  const { sliderId } = req.params;
  const updateData = req.body;
  
  const updatedSlider = await sliderService.updateSlider(sliderId, updateData);
  
  res.status(200).json({
    success: true,
    message: 'Slider updated successfully',
    data: updatedSlider
  });
});

// Delete slider (Admin only)
export const deleteSlider = asyncHandler(async (req, res) => {
  const { sliderId } = req.params;
  
  await sliderService.deleteSlider(sliderId);
  
  res.status(200).json({
    success: true,
    message: 'Slider deleted successfully'
  });
});

// Toggle slider status (Admin only)
export const toggleSliderStatus = asyncHandler(async (req, res) => {
  const { sliderId } = req.params;
  const { isActive } = req.body;
  
  const updatedSlider = await sliderService.toggleSliderStatus(sliderId, isActive);
  
  res.status(200).json({
    success: true,
    message: `Slider ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: updatedSlider
  });
});

// Reorder sliders (Admin only)
export const reorderSliders = asyncHandler(async (req, res) => {
  const { sliderOrders } = req.body;
  
  if (!sliderOrders || !Array.isArray(sliderOrders)) {
    return res.status(400).json({
      success: false,
      message: 'Slider orders array is required'
    });
  }
  
  const results = await sliderService.reorderSliders(sliderOrders);
  
  res.status(200).json({
    success: true,
    message: 'Sliders reordered successfully',
    data: results
  });
});

// Get slider statistics (Admin only)
export const getSliderStats = asyncHandler(async (req, res) => {
  const stats = await sliderService.getSliderStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

// Get slider performance metrics (Admin only)
export const getSliderPerformance = asyncHandler(async (req, res) => {
  const performance = await sliderService.getSliderPerformance();
  
  res.status(200).json({
    success: true,
    data: performance
  });
});