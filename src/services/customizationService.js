// services/customizationService.js
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

class CustomizationService {
  // Get customization by product ID
async getCustomizationByProductId(productId) {
  try {
    const customization = await prisma.productCustomization.findFirst({
      where: { 
        productId, 
        isActive: true 
      },
      include: {
        product: {
          include: {
            images: true,
            variants: {
              where: { stock: { gt: 0 } }
            }
          }
        }
      }
    });
    
    // Return null instead of throwing error
    return customization;
  } catch (error) {
    logger.error('Error in getCustomizationByProductId:', error);
    throw new Error('Failed to fetch customization');
  }
}
  
  // Create customization
  async createCustomization(customizationData) {
    const { 
      productId, 
      name, 
      basePrice, 
      maxTextLength = 100, 
      maxImages = 5, 
      allowedFonts = [], 
      allowedColors = [] 
    } = customizationData;
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Check if customization already exists for this product
    const existingCustomization = await prisma.productCustomization.findFirst({
      where: { productId }
    });
    
    if (existingCustomization) {
      throw new Error('Customization already exists for this product');
    }
    
    try {
      const customization = await prisma.productCustomization.create({
        data: {
          productId,
          name,
          basePrice,
          maxTextLength,
          maxImages,
          allowedFonts,
          allowedColors
        },
        include: {
          product: true
        }
      });
      
      // Update product to mark as customizable
      await prisma.product.update({
        where: { id: productId },
        data: { 
          isCustomizable: true,
          baseCustomizationPrice: basePrice 
        }
      });
      
      logger.info(`Customization created: ${customization.id}`);
      return customization;
    } catch (error) {
      logger.error('Error in createCustomization:', error);
      throw new Error('Failed to create customization');
    }
  }
  
  // Update customization
  async updateCustomization(customizationId, updateData) {
    const customization = await prisma.productCustomization.findUnique({
      where: { id: customizationId }
    });
    
    if (!customization) {
      throw new Error('Customization not found');
    }
    
    try {
      const updatedCustomization = await prisma.productCustomization.update({
        where: { id: customizationId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          product: true
        }
      });
      
      logger.info(`Customization updated: ${customizationId}`);
      return updatedCustomization;
    } catch (error) {
      logger.error('Error in updateCustomization:', error);
      throw new Error('Failed to update customization');
    }
  }
  
  // Toggle customization status
  async toggleCustomizationStatus(customizationId, isActive) {
    const customization = await prisma.productCustomization.findUnique({
      where: { id: customizationId }
    });
    
    if (!customization) {
      throw new Error('Customization not found');
    }
    
    const activeStatus = isActive === true || isActive === 'true';
    
    try {
      const updatedCustomization = await prisma.productCustomization.update({
        where: { id: customizationId },
        data: {
          isActive: activeStatus,
          updatedAt: new Date()
        }
      });
      
      // Update product customizable status
      await prisma.product.update({
        where: { id: customization.productId },
        data: { isCustomizable: activeStatus }
      });
      
      logger.info(`Customization status updated: ${customizationId} -> ${activeStatus ? 'active' : 'inactive'}`);
      return updatedCustomization;
    } catch (error) {
      logger.error('Error in toggleCustomizationStatus:', error);
      throw new Error('Failed to update customization status');
    }
  }
  
  // Delete customization
  async deleteCustomization(customizationId) {
    const customization = await prisma.productCustomization.findUnique({
      where: { id: customizationId },
      include: {
        designs: true
      }
    });
    
    if (!customization) {
      throw new Error('Customization not found');
    }
    
    // Check if there are designs associated
    if (customization.designs.length > 0) {
      throw new Error('Cannot delete customization with existing designs');
    }
    
    try {
      // Update product to mark as not customizable
      await prisma.product.update({
        where: { id: customization.productId },
        data: { 
          isCustomizable: false,
          baseCustomizationPrice: 0 
        }
      });
      
      await prisma.productCustomization.delete({
        where: { id: customizationId }
      });
      
      logger.info(`Customization deleted: ${customizationId}`);
    } catch (error) {
      logger.error('Error in deleteCustomization:', error);
      throw new Error('Failed to delete customization');
    }
  }
}

export default new CustomizationService();