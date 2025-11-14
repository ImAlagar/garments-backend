import { sliderService } from '../services/index.js';
import s3SliderService from '../services/s3SliderService.js';
import { asyncHandler } from '../utils/helpers.js';
import logger from '../utils/logger.js';
import prisma from '../config/database.js';

// Helper function to check database availability
const checkDatabase = () => {
  if (!prisma) {
    logger.error('Prisma client is not available');
    throw new Error('Database connection not available');
  }
  return true;
};

// Get active sliders for home page (Public)
export const getActiveSliders = asyncHandler(async (req, res) => {
  try {
    checkDatabase();
    const sliders = await sliderService.getActiveSliders();
    
    res.status(200).json({
      success: true,
      data: sliders
    });
  } catch (error) {
    logger.error('Error in getActiveSliders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active sliders'
    });
  }
});

// Get all sliders (Admin only)
export const getAllSliders = asyncHandler(async (req, res) => {
  try {
    checkDatabase();
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
  } catch (error) {
    logger.error('Error in getAllSliders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sliders'
    });
  }
});

// Get slider by ID
export const getSliderById = asyncHandler(async (req, res) => {
  try {
    checkDatabase();
    const { sliderId } = req.params;
    
    const slider = await sliderService.getSliderById(sliderId);
    
    res.status(200).json({
      success: true,
      data: slider
    });
  } catch (error) {
    logger.error('Error in getSliderById:', error);
    if (error.message === 'Slider not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch slider'
      });
    }
  }
});

// Create slider (Admin only)
export const createSlider = asyncHandler(async (req, res) => {
  try {
    checkDatabase();
    
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    // Extract data from req.body (already parsed by middleware)
    const sliderData = {
      title: req.body.title,
      subtitle: req.body.subtitle || null,
      description: req.body.description || null,
      smallText: req.body.smallText || null,
      offerText: req.body.offerText || null,
      buttonText: req.body.buttonText || null,
      buttonLink: req.body.buttonLink || null,
      layout: req.body.layout || 'left',
      order: req.body.order ? parseInt(req.body.order) : 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : true,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null
    };

    console.log('Processed slider data:', sliderData);

    // Validate required fields
    if (!sliderData.title) {
      return res.status(400).json({
        success: false,
        message: 'Slider title is required'
      });
    }

    // Validate that required files are provided
    if (!req.files?.bgImage || !req.files?.image) {
      return res.status(400).json({
        success: false,
        message: 'Both background image and main image are required'
      });
    }

    // Upload images to S3
    const uploadResult = await s3SliderService.uploadSliderImages(
      req.files.bgImage[0],
      req.files.image[0]
    );

    // Add S3 URLs to slider data
    sliderData.bgImage = uploadResult.bgImage.url;
    sliderData.bgImagePublicId = uploadResult.bgImage.key;
    sliderData.image = uploadResult.mainImage.url;
    sliderData.imagePublicId = uploadResult.mainImage.key;

    console.log('Final slider data with images:', sliderData);

    // Create slider in database
    const slider = await sliderService.createSlider(sliderData);
    
    res.status(201).json({
      success: true,
      message: 'Slider created successfully',
      data: slider
    });
  } catch (uploadError) {
    console.error('S3 upload failed:', uploadError);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images to cloud storage'
    });
  } 
});

// Update slider (Admin only)
export const updateSlider = asyncHandler(async (req, res) => {
  try {
    checkDatabase();
    const { sliderId } = req.params;
    
    const updateData = {
      ...req.body,
      // Parse dates if provided
      ...(req.body.startDate && { startDate: new Date(req.body.startDate) }),
      ...(req.body.endDate && { endDate: new Date(req.body.endDate) }),
      // Parse boolean fields
      ...(req.body.isActive !== undefined && { 
        isActive: req.body.isActive === 'true' 
      }),
      ...(req.body.order !== undefined && { 
        order: parseInt(req.body.order) 
      })
    };

    // Handle uploaded files
    if (req.files) {
      try {
        // If new images are uploaded, upload to S3 and update URLs
        if (req.files.bgImage && req.files.bgImage[0]) {
          const bgImageResult = await s3SliderService.uploadSliderBgImage(
            req.files.bgImage[0],
            sliderId
          );
          updateData.bgImage = bgImageResult.url;
          updateData.bgImagePublicId = bgImageResult.key;
        }

        if (req.files.image && req.files.image[0]) {
          const mainImageResult = await s3SliderService.uploadSliderMainImage(
            req.files.image[0],
            sliderId
          );
          updateData.image = mainImageResult.url;
          updateData.imagePublicId = mainImageResult.key;
        }
      } catch (uploadError) {
        console.error('S3 upload failed during update:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images to cloud storage'
        });
      }
    }

    const updatedSlider = await sliderService.updateSlider(sliderId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Slider updated successfully',
      data: updatedSlider
    });
  } catch (error) {
    logger.error('Error in updateSlider:', error);
    if (error.message === 'Slider not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update slider'
      });
    }
  }
});

// Delete slider (Admin only)
export const deleteSlider = asyncHandler(async (req, res) => {
  try {
    checkDatabase();
    const { sliderId } = req.params;
    
    // First get slider to check if it exists and get image public IDs
    const slider = await sliderService.getSliderById(sliderId);
    
    try {
      // Delete images from S3 if they exist
      if (slider.bgImagePublicId || slider.imagePublicId) {
        await s3SliderService.deleteSliderImages(sliderId);
      }
    } catch (s3Error) {
      logger.warn('Failed to delete S3 images, continuing with database deletion:', s3Error);
      // Continue with database deletion even if S3 deletion fails
    }
    
    // Delete slider from database
    await sliderService.deleteSlider(sliderId);
    
    res.status(200).json({
      success: true,
      message: 'Slider deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteSlider:', error);
    if (error.message === 'Slider not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete slider'
      });
    }
  }
});

// Toggle slider status (Admin only)
export const toggleSliderStatus = asyncHandler(async (req, res) => {
  try {
    checkDatabase();
    const { sliderId } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'isActive field is required'
      });
    }
    
    const updatedSlider = await sliderService.toggleSliderStatus(
      sliderId, 
      isActive === true || isActive === 'true'
    );
    
    res.status(200).json({
      success: true,
      message: `Slider ${updatedSlider.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedSlider
    });
  } catch (error) {
    logger.error('Error in toggleSliderStatus:', error);
    if (error.message === 'Slider not found') {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to toggle slider status'
      });
    }
  }
});

// Reorder sliders (Admin only)
export const reorderSliders = asyncHandler(async (req, res) => {
  try {
    checkDatabase();
    const { sliderOrders } = req.body;
    
    if (!sliderOrders || !Array.isArray(sliderOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Slider orders array is required'
      });
    }
    
    // Validate each item in the array
    for (const order of sliderOrders) {
      if (!order.id || order.order === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each slider order must have id and order fields'
        });
      }
    }
    
    const results = await sliderService.reorderSliders(sliderOrders);
    
    res.status(200).json({
      success: true,
      message: 'Sliders reordered successfully',
      data: results
    });
  } catch (error) {
    logger.error('Error in reorderSliders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder sliders'
    });
  }
});

// Get slider statistics (Admin only)
export const getSliderStats = asyncHandler(async (req, res) => {
  try {
    checkDatabase();
    const stats = await sliderService.getSliderStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error in getSliderStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch slider statistics'
    });
  }
});

// Get slider performance metrics (Admin only)
export const getSliderPerformance = asyncHandler(async (req, res) => {
  try {
    checkDatabase();
    const performance = await sliderService.getSliderPerformance();
    
    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Error in getSliderPerformance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch slider performance'
    });
  }
});