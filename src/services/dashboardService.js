// services/dashboardService.js
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

class DashboardService {
  // Get dashboard overview statistics
  async getDashboardOverview(timeRange = 'monthly') {
    try {
      const dateRange = this.getDateRange(timeRange);
      
      const [
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        revenueGrowth,
        orderGrowth,
        productGrowth,
        customerGrowth
      ] = await Promise.all([
        this.getTotalRevenue(dateRange),
        this.getTotalOrders(dateRange),
        this.getTotalProducts(),
        this.getTotalCustomers(),
        this.getRevenueGrowth(dateRange),
        this.getOrderGrowth(dateRange),
        this.getProductGrowth(),
        this.getCustomerGrowth()
      ]);

      return {
        totalRevenue: { value: totalRevenue, change: revenueGrowth, label: 'Total Revenue' },
        totalOrders: { value: totalOrders, change: orderGrowth, label: 'Total Orders' },
        totalProducts: { value: totalProducts, change: productGrowth, label: 'Active Products' },
        totalCustomers: { value: totalCustomers, change: customerGrowth, label: 'Customers' },
      };
    } catch (error) {
      logger.error('Error in getDashboardOverview:', error);
      throw new Error('Failed to fetch dashboard overview');
    }
  }

  // Get business metrics
  async getBusinessMetrics() {
    try {
      const [
        activeSliders,
        pendingOrders,
        lowStockProducts,
        pendingContacts,
        conversionRate,
        averageOrderValue
      ] = await Promise.all([
        this.getActiveSliders(),
        this.getPendingOrders(),
        this.getLowStockProducts(),
        this.getPendingContacts(),
        this.getConversionRate(),
        this.getAverageOrderValue()
      ]);

      return {
        activeSliders: { value: activeSliders, label: 'Active Sliders' },
        pendingOrders: { value: pendingOrders, label: 'Pending Orders' },
        lowStockProducts: { value: lowStockProducts, label: 'Low Stock' },
        pendingContacts: { value: pendingContacts, label: 'Pending Contacts' },
        conversionRate: { value: conversionRate, change: 0.8, label: 'Conversion Rate' },
        averageOrderValue: { value: averageOrderValue, change: 2.1, label: 'Avg Order Value' },
      };
    } catch (error) {
      logger.error('Error in getBusinessMetrics:', error);
      throw new Error('Failed to fetch business metrics');
    }
  }

  // Get recent activities
  async getRecentActivities(limit = 10) {
    try {
      const activities = [];

      // Recent orders
      const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          status: true
        }
      });

      activities.push(...recentOrders.map(order => ({
        type: 'order',
        message: `New order ${order.orderNumber} received`,
        time: this.getTimeAgo(order.createdAt),
        referenceId: order.id
      })));

      // Recent user registrations
      const recentUsers = await prisma.user.findMany({
        take: 3,
        where: { role: 'WHOLESALER' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          role: true
        }
      });

      activities.push(...recentUsers.map(user => ({
        type: 'user',
        message: `New ${user.role.toLowerCase()} registration - ${user.name}`,
        time: this.getTimeAgo(user.createdAt),
        referenceId: user.id
      })));

      // Recent products
      const recentProducts = await prisma.product.findMany({
        take: 2,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      });

      activities.push(...recentProducts.map(product => ({
        type: 'product',
        message: `Product "${product.name}" added`,
        time: this.getTimeAgo(product.createdAt),
        referenceId: product.id
      })));

      // Sort by time and limit
      return activities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, limit);

    } catch (error) {
      logger.error('Error in getRecentActivities:', error);
      throw new Error('Failed to fetch recent activities');
    }
  }

  // Get top performing products
  async getTopProducts(limit = 5) {
    try {
      const topProducts = await prisma.product.findMany({
        take: limit,
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }, // You might want to order by sales/revenue
        select: {
          id: true,
          name: true,
          normalPrice: true,
          offerPrice: true,
          createdAt: true,
          orderItems: {
            select: {
              quantity: true,
              price: true
            }
          }
        }
      });

      return topProducts.map(product => {
        const totalSales = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = product.orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        
        return {
          id: product.id,
          name: product.name,
          sales: totalSales,
          revenue: totalRevenue,
          growth: Math.floor(Math.random() * 20) + 5 // Mock growth for now
        };
      });
    } catch (error) {
      logger.error('Error in getTopProducts:', error);
      throw new Error('Failed to fetch top products');
    }
  }

  // Get quick stats
  async getQuickStats() {
    try {
      const [
        wholesalers,
        categories,
        subcategories,
        ratings
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'WHOLESALER' } }),
        prisma.user.count({ where: { role: 'WHOLESALER', isApproved: false } }),
        prisma.category.count({ where: { isActive: true } }),
        prisma.subcategory.count({ where: { isActive: true } }),
        prisma.rating.count(),
        prisma.rating.count({ where: { isApproved: false } })
      ]);

      return {
        wholesalers: { 
          count: wholesalers, 
          pending: await prisma.user.count({ 
            where: { role: 'WHOLESALER', isApproved: false } 
          }) 
        },
        categories: { 
          count: await prisma.category.count(),
          active: await prisma.category.count({ where: { isActive: true } })
        },
        subcategories: { 
          count: await prisma.subcategory.count(),
          active: await prisma.subcategory.count({ where: { isActive: true } })
        },
        ratings: { 
          total: await prisma.rating.count(),
          pending: await prisma.rating.count({ where: { isApproved: false } })
        }
      };
    } catch (error) {
      logger.error('Error in getQuickStats:', error);
      throw new Error('Failed to fetch quick stats');
    }
  }

  // Get sales data for charts
  async getSalesData(timeRange = 'monthly') {
    try {
      const dateRange = this.getDateRange(timeRange);
      
      // This is a simplified version - you might want to aggregate by day/week/month
      const salesData = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          },
          paymentStatus: 'PAID'
        },
        select: {
          totalAmount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      });

      // Group by month for demo (implement proper grouping based on timeRange)
      const monthlySales = this.groupSalesByMonth(salesData);
      
      return monthlySales;
    } catch (error) {
      logger.error('Error in getSalesData:', error);
      throw new Error('Failed to fetch sales data');
    }
  }

  // Helper methods
  getDateRange(timeRange) {
    const now = new Date();
    const start = new Date();

    switch (timeRange) {
      case 'daily':
        start.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }

    return { start, end: now };
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  }

  groupSalesByMonth(salesData) {
    // Simplified grouping - implement proper aggregation based on your needs
    const monthlyTotals = {};
    
    salesData.forEach(order => {
      const month = order.createdAt.toLocaleString('default', { month: 'short' });
      monthlyTotals[month] = (monthlyTotals[month] || 0) + order.totalAmount;
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const values = months.map(month => monthlyTotals[month] || 0);

    return { labels: months.slice(0, 6), values: values.slice(0, 6) }; // Last 6 months
  }

  // Individual metric methods
  async getTotalRevenue(dateRange) {
    const result = await prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      _sum: {
        totalAmount: true
      }
    });
    return result._sum.totalAmount || 0;
  }

  async getTotalOrders(dateRange) {
    return await prisma.order.count({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    });
  }

  async getTotalProducts() {
    return await prisma.product.count({
      where: { status: 'ACTIVE' }
    });
  }

  async getTotalCustomers() {
    return await prisma.user.count({
      where: { role: { in: ['CUSTOMER', 'WHOLESALER'] } }
    });
  }

  async getRevenueGrowth(dateRange) {
    const previousRange = this.getPreviousDateRange(dateRange);
    const currentRevenue = await this.getTotalRevenue(dateRange);
    const previousRevenue = await this.getTotalRevenue(previousRange);
    
    if (previousRevenue === 0) return 100;
    return ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1);
  }

  async getOrderGrowth(dateRange) {
    const previousRange = this.getPreviousDateRange(dateRange);
    const currentOrders = await this.getTotalOrders(dateRange);
    const previousOrders = await this.getTotalOrders(previousRange);
    
    if (previousOrders === 0) return 100;
    return ((currentOrders - previousOrders) / previousOrders * 100).toFixed(1);
  }

  async getProductGrowth() {
    // Simplified growth calculation
    return 12.3; // Mock data for now
  }

  async getCustomerGrowth() {
    // Simplified growth calculation
    return 5.6; // Mock data for now
  }

  async getActiveSliders() {
    return await prisma.homeSlider.count({
      where: { 
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { 
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          }
        ]
      }
    });
  }

  async getPendingOrders() {
    return await prisma.order.count({
      where: { status: 'PENDING' }
    });
  }

  async getLowStockProducts() {
    return await prisma.productVariant.count({
      where: { stock: { lt: 10 } } // Less than 10 items
    });
  }

  async getPendingContacts() {
    return await prisma.contact.count({
      where: { status: 'PENDING' }
    });
  }

  async getConversionRate() {
    // Simplified conversion rate calculation
    return 3.4; // Mock data for now
  }

  async getAverageOrderValue() {
    const result = await prisma.order.aggregate({
      where: { paymentStatus: 'PAID' },
      _avg: {
        totalAmount: true
      }
    });
    return result._avg.totalAmount || 0;
  }

  getPreviousDateRange(currentRange) {
    const diff = currentRange.end - currentRange.start;
    return {
      start: new Date(currentRange.start.getTime() - diff),
      end: currentRange.start
    };
  }
}

export default new DashboardService();