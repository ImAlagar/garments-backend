import prisma from '../config/database.js';
import logger from '../utils/logger.js';

class SliderService {
  constructor() {
    this.safeDatabaseOperation = this.safeDatabaseOperation.bind(this);
  }

  // Safe database operation wrapper
  async safeDatabaseOperation(operation, fallbackValue = null, operationName = 'unknown') {
    try {
      if (!prisma) {
        logger.warn(`Prisma not available for operation: ${operationName}`);
        return fallbackValue;
      }
      
      // Check if the required Prisma model exists
      if (operationName.includes('homeSlider') && !prisma.homeSlider) {
        logger.warn(`Prisma model homeSlider not found for operation: ${operationName}`);
        return fallbackValue;
      }
      
      return await operation();
    } catch (error) {
      logger.warn(`Database operation failed (${operationName}):`, error.message);
      return fallbackValue;
    }
  }

  // Get all active sliders for home page
  async getActiveSliders() {
    return this.safeDatabaseOperation(async () => {
      const currentDate = new Date();
      
      const sliders = await prisma.homeSlider.findMany({
        where: {
          isActive: true,
          OR: [
            {
              startDate: null,
              endDate: null
            },
            {
              startDate: { lte: currentDate },
              endDate: { gte: currentDate }
            },
            {
              startDate: { lte: currentDate },
              endDate: null
            }
          ]
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          subtitle: true,
          description: true,
          smallText: true,
          offerText: true,
          buttonText: true,
          buttonLink: true,
          layout: true,
          bgImage: true,
          image: true,
          order: true
        }
      });

      return sliders || [];
    }, [], 'getActiveSliders');
  }

  // Get all sliders (Admin)
  async getAllSliders({ page = 1, limit = 10, isActive } = {}) {
    return this.safeDatabaseOperation(async () => {
      const skip = (page - 1) * limit;
      
      const where = {};
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      
      const [sliders, total] = await Promise.all([
        prisma.homeSlider.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: [
            { order: 'asc' },
            { createdAt: 'desc' }
          ]
        }),
        prisma.homeSlider.count({ where })
      ]);
      
      return {
        sliders: sliders || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total || 0,
          pages: Math.ceil((total || 0) / limit)
        }
      };
    }, { sliders: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }, 'getAllSliders');
  }

  // Get slider by ID
  async getSliderById(sliderId) {
    return this.safeDatabaseOperation(async () => {
      const slider = await prisma.homeSlider.findUnique({
        where: { id: sliderId }
      });
      
      if (!slider) {
        throw new Error('Slider not found');
      }
      
      return slider;
    }, null, 'getSliderById');
  }

  // Create slider
  async createSlider(sliderData) {
    return this.safeDatabaseOperation(async () => {
      const {
        title,
        subtitle,
        description,
        smallText,
        offerText,
        buttonText,
        buttonLink,
        layout,
        bgImage,
        image,
        imagePublicId,
        bgImagePublicId,
        isActive,
        order,
        startDate,
        endDate
      } = sliderData;

      // Validate required fields
      if (!title || !bgImage || !image) {
        throw new Error('Title, background image, and image are required');
      }

      const slider = await prisma.homeSlider.create({
        data: {
          title,
          subtitle: subtitle || null,
          description: description || null,
          smallText: smallText || null,
          offerText: offerText || null,
          buttonText: buttonText || null,
          buttonLink: buttonLink || null,
          layout: layout || 'left',
          bgImage,
          image,
          imagePublicId: imagePublicId || null,
          bgImagePublicId: bgImagePublicId || null,
          isActive: isActive !== undefined ? isActive : true,
          order: order || 0,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null
        }
      });

      logger.info(`Slider created: ${slider.id}`);
      return slider;
    }, null, 'createSlider');
  }

  // Update slider
  async updateSlider(sliderId, updateData) {
    return this.safeDatabaseOperation(async () => {
      const slider = await prisma.homeSlider.findUnique({
        where: { id: sliderId }
      });
      
      if (!slider) {
        throw new Error('Slider not found');
      }

      const updatedSlider = await prisma.homeSlider.update({
        where: { id: sliderId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      logger.info(`Slider updated: ${sliderId}`);
      return updatedSlider;
    }, null, 'updateSlider');
  }

  // Delete slider
  async deleteSlider(sliderId) {
    return this.safeDatabaseOperation(async () => {
      const slider = await prisma.homeSlider.findUnique({
        where: { id: sliderId }
      });
      
      if (!slider) {
        throw new Error('Slider not found');
      }

      await prisma.homeSlider.delete({
        where: { id: sliderId }
      });

      logger.info(`Slider deleted: ${sliderId}`);
      return { success: true };
    }, null, 'deleteSlider');
  }

  // Toggle slider active status
  async toggleSliderStatus(sliderId, isActive) {
    return this.safeDatabaseOperation(async () => {
      const slider = await prisma.homeSlider.findUnique({
        where: { id: sliderId }
      });
      
      if (!slider) {
        throw new Error('Slider not found');
      }

      const updatedSlider = await prisma.homeSlider.update({
        where: { id: sliderId },
        data: {
          isActive: isActive,
          updatedAt: new Date()
        }
      });

      logger.info(`Slider status updated: ${sliderId} -> ${updatedSlider.isActive}`);
      return updatedSlider;
    }, null, 'toggleSliderStatus');
  }

  // Reorder sliders
  async reorderSliders(sliderOrders) {
    return this.safeDatabaseOperation(async () => {
      if (!Array.isArray(sliderOrders) || sliderOrders.length === 0) {
        throw new Error('Slider orders array is required');
      }

      const transactions = sliderOrders.map(({ id, order }) =>
        prisma.homeSlider.update({
          where: { id },
          data: { order: parseInt(order) }
        })
      );

      const results = await prisma.$transaction(transactions);
      logger.info(`Sliders reordered: ${sliderOrders.length} items`);
      
      return results;
    }, [], 'reorderSliders');
  }

  // Get slider statistics
  async getSliderStats() {
    return this.safeDatabaseOperation(async () => {
      const currentDate = new Date();

      // Get total sliders count
      const totalSliders = await prisma.homeSlider.count().catch(() => 0);

      // Get active sliders
      const activeSliders = await prisma.homeSlider.count({
        where: {
          isActive: true,
          OR: [
            {
              startDate: null,
              endDate: null
            },
            {
              startDate: { lte: currentDate },
              endDate: { gte: currentDate }
            },
            {
              startDate: { lte: currentDate },
              endDate: null
            }
          ]
        }
      }).catch(() => 0);

      // Get inactive sliders
      const inactiveSliders = await prisma.homeSlider.count({
        where: {
          isActive: false
        }
      }).catch(() => 0);

      // Get expired sliders
      const expiredSliders = await prisma.homeSlider.count({
        where: {
          endDate: { lt: currentDate },
          isActive: true
        }
      }).catch(() => 0);

      // Get scheduled sliders
      const scheduledSliders = await prisma.homeSlider.count({
        where: {
          startDate: { gt: currentDate },
          isActive: true
        }
      }).catch(() => 0);

      // Get sliders by layout type
      const slidersByLayout = await prisma.homeSlider.groupBy({
        by: ['layout'],
        _count: {
          id: true
        }
      }).catch(() => []);

      // Get sliders with button actions
      const slidersWithButtons = await prisma.homeSlider.count({
        where: {
          AND: [
            { buttonText: { not: null } },
            { buttonLink: { not: null } }
          ]
        }
      }).catch(() => 0);

      // Get sliders with offer text
      const slidersWithOffers = await prisma.homeSlider.count({
        where: {
          offerText: { not: null }
        }
      }).catch(() => 0);

      // Get recent sliders (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentSliders = await prisma.homeSlider.count({
        where: {
          createdAt: { gte: weekAgo }
        }
      }).catch(() => 0);

      // Get top ordered sliders
      const topOrderedSliders = await prisma.homeSlider.findMany({
        take: 5,
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
          isActive: true
        }
      }).catch(() => []);

      // Get all sliders to check for missing images
      const allSliders = await prisma.homeSlider.findMany({
        select: {
          id: true,
          bgImage: true,
          image: true
        }
      }).catch(() => []);

      // Calculate missing image counts
      let slidersWithoutBgImageCount = 0;
      let slidersWithoutImageCount = 0;
      let slidersWithoutAnyImages = 0;

      allSliders.forEach(slider => {
        const hasBgImage = slider.bgImage && slider.bgImage.trim() !== '';
        const hasImage = slider.image && slider.image.trim() !== '';

        if (!hasBgImage) slidersWithoutBgImageCount++;
        if (!hasImage) slidersWithoutImageCount++;
        if (!hasBgImage && !hasImage) slidersWithoutAnyImages++;
      });

      // Convert layout data to object
      const layoutData = slidersByLayout.reduce((acc, item) => {
        acc[item.layout] = item._count.id;
        return acc;
      }, {});

      return {
        totalSliders,
        activeSliders,
        inactiveSliders,
        expiredSliders,
        scheduledSliders,
        slidersByLayout: layoutData,
        slidersWithButtons,
        slidersWithOffers,
        recentSliders,
        topOrderedSliders,
        slidersWithoutBgImage: slidersWithoutBgImageCount,
        slidersWithoutImage: slidersWithoutImageCount,
        slidersWithoutAnyImages,
        // Summary stats
        summary: {
          activePercentage: totalSliders > 0 ? Math.round((activeSliders / totalSliders) * 100) : 0,
          withButtonsPercentage: totalSliders > 0 ? Math.round((slidersWithButtons / totalSliders) * 100) : 0,
          recentPercentage: totalSliders > 0 ? Math.round((recentSliders / totalSliders) * 100) : 0,
          imagesMissingPercentage: totalSliders > 0 ? Math.round((slidersWithoutAnyImages / totalSliders) * 100) : 0
        }
      };
    }, this.getDefaultSliderStats(), 'getSliderStats');
  }

  // Get default slider stats for fallback
  getDefaultSliderStats() {
    return {
      totalSliders: 0,
      activeSliders: 0,
      inactiveSliders: 0,
      expiredSliders: 0,
      scheduledSliders: 0,
      slidersByLayout: {},
      slidersWithButtons: 0,
      slidersWithOffers: 0,
      recentSliders: 0,
      topOrderedSliders: [],
      slidersWithoutBgImage: 0,
      slidersWithoutImage: 0,
      slidersWithoutAnyImages: 0,
      summary: {
        activePercentage: 0,
        withButtonsPercentage: 0,
        recentPercentage: 0,
        imagesMissingPercentage: 0
      }
    };
  }

  // Get slider performance metrics
  async getSliderPerformance() {
    return this.safeDatabaseOperation(async () => {
      const currentDate = new Date();
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Monthly sliders count
      const monthlySliders = await prisma.homeSlider.count({
        where: {
          createdAt: { gte: monthAgo }
        }
      }).catch(() => 0);

      // Get layout distribution
      const layoutDistribution = await prisma.homeSlider.groupBy({
        by: ['layout'],
        _count: {
          id: true
        }
      }).catch(() => []);

      // Get active vs inactive ratio
      const activeCount = await prisma.homeSlider.count({
        where: { isActive: true }
      }).catch(() => 0);

      const inactiveCount = await prisma.homeSlider.count({
        where: { isActive: false }
      }).catch(() => 0);

      return {
        monthlySliders,
        layoutDistribution: layoutDistribution.reduce((acc, item) => {
          acc[item.layout] = item._count.id;
          return acc;
        }, {}),
        activeInactiveRatio: {
          active: activeCount,
          inactive: inactiveCount,
          total: activeCount + inactiveCount
        },
        analytics: {
          _note: "Analytics tracking can be added later for views and clicks",
          suggestedMetrics: [
            "Click-through rates",
            "View counts",
            "Conversion rates",
            "Engagement time"
          ]
        }
      };
    }, this.getDefaultPerformanceStats(), 'getSliderPerformance');
  }

  // Get default performance stats for fallback
  getDefaultPerformanceStats() {
    return {
      monthlySliders: 0,
      layoutDistribution: {},
      activeInactiveRatio: {
        active: 0,
        inactive: 0,
        total: 0
      },
      analytics: {
        _note: "Analytics data not available",
        suggestedMetrics: [
          "Click-through rates",
          "View counts",
          "Conversion rates",
          "Engagement time"
        ]
      }
    };
  }
}

export default new SliderService();