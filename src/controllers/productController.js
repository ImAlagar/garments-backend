// controllers/productController.js
import { productService } from '../services/index.js';
import { asyncHandler } from '../utils/helpers.js';
import logger from '../utils/logger.js';

// Get all products
export const getAllProducts = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    categoryId, 
    subcategoryId, 
    status,
    search,
    minPrice,
    maxPrice,
    includeVariants 
  } = req.query;
  
  const result = await productService.getAllProducts({
    page: parseInt(page),
    limit: parseInt(limit),
    categoryId,
    subcategoryId,
    status,
    search,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    includeVariants: includeVariants === 'true'
  });
  
  res.status(200).json({
    success: true,
    data: result
  });
});

// Get product by ID
export const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { includeVariants } = req.query;
  
  const product = await productService.getProductById(
    productId, 
    includeVariants === 'true'
  );
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// Get product by product code
export const getProductByCode = asyncHandler(async (req, res) => {
  const { productCode } = req.params;
  const { includeVariants } = req.query;
  
  const product = await productService.getProductByCode(
    productCode, 
    includeVariants === 'true'
  );
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// Create product (Admin only)
export const createProduct = asyncHandler(async (req, res) => {
  const productData = req.body;
  const files = req.files || [];
  
  // Parse JSON fields
  if (productData.details) {
    try {
      productData.details = JSON.parse(productData.details);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid details JSON format'
      });
    }
  }
  
  if (productData.variants) {
    try {
      productData.variants = JSON.parse(productData.variants);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid variants JSON format'
      });
    }
  }
  
  const product = await productService.createProduct(productData, files);
  
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

// Update product (Admin only)
export const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const updateData = req.body;
  const files = req.files || [];
  
  // Parse JSON fields
  if (updateData.details) {
    try {
      updateData.details = JSON.parse(updateData.details);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid details JSON format'
      });
    }
  }
  
  const updatedProduct = await productService.updateProduct(
    productId, 
    updateData, 
    files
  );
  
  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
});

// Delete product (Admin only)
export const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  
  await productService.deleteProduct(productId);
  
  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Toggle product status (Admin only)
export const toggleProductStatus = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { status } = req.body;
  
  const updatedProduct = await productService.toggleProductStatus(
    productId, 
    status
  );
  
  res.status(200).json({
    success: true,
    message: `Product ${status.toLowerCase()} successfully`,
    data: updatedProduct
  });
});

// Add product images (Admin only)
export const addProductImages = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const files = req.files || [];
  
  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one image is required'
    });
  }
  
  const updatedProduct = await productService.addProductImages(productId, files);
  
  res.status(200).json({
    success: true,
    message: 'Product images added successfully',
    data: updatedProduct
  });
});

// Remove product image (Admin only)
export const removeProductImage = asyncHandler(async (req, res) => {
  const { productId, imageId } = req.params;
  
  const updatedProduct = await productService.removeProductImage(productId, imageId);
  
  res.status(200).json({
    success: true,
    message: 'Product image removed successfully',
    data: updatedProduct
  });
});

// Set primary product image (Admin only)
export const setPrimaryProductImage = asyncHandler(async (req, res) => {
  const { productId, imageId } = req.params;
  
  const updatedProduct = await productService.setPrimaryProductImage(
    productId, 
    imageId
  );
  
  res.status(200).json({
    success: true,
    message: 'Primary product image set successfully',
    data: updatedProduct
  });
});

// Add product variant (Admin only)
export const addProductVariant = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const variantData = req.body;
  const files = req.files || [];
  
  const updatedProduct = await productService.addProductVariant(
    productId, 
    variantData, 
    files
  );
  
  res.status(200).json({
    success: true,
    message: 'Product variant added successfully',
    data: updatedProduct
  });
});

// Update product variant (Admin only)
export const updateProductVariant = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;
  const variantData = req.body;
  const files = req.files || [];
  
  const updatedProduct = await productService.updateProductVariant(
    productId,
    variantId, 
    variantData, 
    files
  );
  
  res.status(200).json({
    success: true,
    message: 'Product variant updated successfully',
    data: updatedProduct
  });
});

// Remove product variant (Admin only)
export const removeProductVariant = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;
  
  const updatedProduct = await productService.removeProductVariant(
    productId, 
    variantId
  );
  
  res.status(200).json({
    success: true,
    message: 'Product variant removed successfully',
    data: updatedProduct
  });
});

// Add variant images (Admin only)
export const addVariantImages = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;
  const files = req.files || [];
  
  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one image is required'
    });
  }
  
  const updatedProduct = await productService.addVariantImages(
    productId,
    variantId, 
    files
  );
  
  res.status(200).json({
    success: true,
    message: 'Variant images added successfully',
    data: updatedProduct
  });
});

// Remove variant image (Admin only)
export const removeVariantImage = asyncHandler(async (req, res) => {
  const { productId, variantId, imageId } = req.params;
  
  const updatedProduct = await productService.removeVariantImage(
    productId,
    variantId, 
    imageId
  );
  
  res.status(200).json({
    success: true,
    message: 'Variant image removed successfully',
    data: updatedProduct
  });
});

// Set primary variant image (Admin only)
export const setPrimaryVariantImage = asyncHandler(async (req, res) => {
  const { productId, variantId, imageId } = req.params;
  
  const updatedProduct = await productService.setPrimaryVariantImage(
    productId,
    variantId, 
    imageId
  );
  
  res.status(200).json({
    success: true,
    message: 'Primary variant image set successfully',
    data: updatedProduct
  });
});

// Update variant stock (Admin only)
export const updateVariantStock = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;
  const { stock } = req.body;
  
  const updatedVariant = await productService.updateVariantStock(
    productId,
    variantId, 
    parseInt(stock)
  );
  
  res.status(200).json({
    success: true,
    message: 'Variant stock updated successfully',
    data: updatedVariant
  });
});

// Get product statistics (Admin only)
export const getProductStats = asyncHandler(async (req, res) => {
  const stats = await productService.getProductStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

// Search products
export const searchProducts = asyncHandler(async (req, res) => {
  const { 
    query, 
    categoryId, 
    subcategoryId,
    minPrice,
    maxPrice,
    colors,
    sizes,
    page = 1,
    limit = 12
  } = req.query;
  
  const result = await productService.searchProducts({
    query,
    categoryId,
    subcategoryId,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    colors: colors ? colors.split(',') : [],
    sizes: sizes ? sizes.split(',') : [],
    page: parseInt(page),
    limit: parseInt(limit)
  });
  
  res.status(200).json({
    success: true,
    data: result
  });
});