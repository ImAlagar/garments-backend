import prisma from '../config/database.js';
import s3UploadService from './s3UploadService.js';
import logger from '../utils/logger.js';

class ProductService {
    
// Get all products
async getAllProducts({ 
    page = 1, 
    limit = 10, 
    categoryId, 
    subcategoryId, 
    status,
    search,
    minPrice,
    maxPrice,
    includeVariants = true // Changed default to true
}) {
    const skip = (page - 1) * limit;
    
    const where = {};
    
    if (categoryId) {
        where.categoryId = categoryId;
    }
    
    if (subcategoryId) {
        where.subcategoryId = subcategoryId;
    }
    
    if (status) {
        where.status = status;
    }
    
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { productCode: { contains: search, mode: 'insensitive' } }
        ];
    }
    
    if (minPrice !== undefined || maxPrice !== undefined) {
        where.OR = [
            {
                normalPrice: {
                    ...(minPrice !== undefined && { gte: parseFloat(minPrice) }),
                    ...(maxPrice !== undefined && { lte: parseFloat(maxPrice) })
                }
            },
            {
                offerPrice: {
                    ...(minPrice !== undefined && { gte: parseFloat(minPrice) }),
                    ...(maxPrice !== undefined && { lte: parseFloat(maxPrice) })
                }
            }
        ];
    }
    
    const include = {
        category: {
            select: {
                id: true,
                name: true,
                image: true
            }
        },
        subcategory: {
            select: {
                id: true,
                name: true,
                image: true
            }
        },
        productDetails: true,
        ratings: {
            where: {
                isApproved: true
            },
            select: {
                rating: true,
                review: true
            }
        },
        // ALWAYS include variants with their images
        variants: {
            include: {
                variantImages: {
                    orderBy: {
                        isPrimary: 'desc'
                    }
                }
            }
        }
    };
    
    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            skip,
            take: limit,
            include,
            orderBy: {
                createdAt: 'desc'
            }
        }),
        prisma.product.count({ where })
    ]);
    
    // Calculate average ratings
    const productsWithAvgRating = products.map(product => {
        const ratings = product.ratings;
        const avgRating = ratings.length > 0 
            ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
            : 0;
        
        return {
            ...product,
            avgRating: Math.round(avgRating * 10) / 10,
            totalRatings: ratings.length
        };
    });
    
    return {
        products: productsWithAvgRating,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
}

// Get product by ID - IMPROVED
async getProductById(productId, includeVariants = true) {
    const include = {
        category: {
            select: {
                id: true,
                name: true,
                image: true
            }
        },
        subcategory: {
            select: {
                id: true,
                name: true,
                image: true
            }
        },
        productDetails: true,
        ratings: {
            where: {
                isApproved: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        },
        // ALWAYS include variants with their images
        variants: {
            include: {
                variantImages: {
                    orderBy: {
                        isPrimary: 'desc'
                    }
                }
            }
        }
    };
    
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include
    });
    
    if (!product) {
        throw new Error('Product not found');
    }
    
    // Calculate average rating
    const ratings = product.ratings;
    const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
        : 0;
    
    return {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings: ratings.length
    };
}

// Get product by product code - IMPROVED
async getProductByCode(productCode, includeVariants = true) {
    const include = {
        category: {
            select: {
                id: true,
                name: true,
                image: true
            }
        },
        subcategory: {
            select: {
                id: true,
                name: true,
                image: true
            }
        },
        productDetails: true,
        ratings: {
            where: {
                isApproved: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        },
        // ALWAYS include variants with their images
        variants: {
            include: {
                variantImages: {
                    orderBy: {
                        isPrimary: 'desc'
                    }
                }
            }
        }
    };
    
    const product = await prisma.product.findUnique({
        where: { productCode },
        include
    });
    
    if (!product) {
        throw new Error('Product not found');
    }
    
    // Calculate average rating
    const ratings = product.ratings;
    const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
        : 0;
    
    return {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings: ratings.length
    };
}
  
async createProduct(productData, variantImages = []) {
    console.log('=== PRODUCT CREATION STARTED ===');

    const {
        name,
        productCode,
        description,
        normalPrice,
        offerPrice,
        wholesalePrice,
        categoryId,
        subcategoryId,
        productDetails = [],
        variants = []
    } = productData;

    // Log incoming data for debugging
    console.log('Product Code:', productCode);
    console.log('Total Variant Groups:', variants.length);
    console.log('Total Variant Images:', variantImages.length);
    
    // Log the actual variants structure from frontend
    console.log('=== VARIANTS DATA FROM FRONTEND ===');
    variants.forEach((variant, index) => {
        console.log(`Variant ${index}:`, {
            color: variant.color,
            sizesCount: variant.sizes?.length || 0,
            sizes: variant.sizes || []
        });
    });
    
    // Check if product code already exists
    const existingProduct = await prisma.product.findUnique({
        where: { productCode }
    });
    
    if (existingProduct) {
        throw new Error('Product code already exists');
    }
    
    // Check if category exists
    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    });
    
    if (!category) {
        throw new Error('Category not found');
    }
    
    // Check if subcategory exists and belongs to category
    if (subcategoryId) {
        const subcategory = await prisma.subcategory.findUnique({
            where: { id: subcategoryId }
        });
        
        if (!subcategory) {
            throw new Error('Subcategory not found');
        }
        
        if (subcategory.categoryId !== categoryId) {
            throw new Error('Subcategory does not belong to the specified category');
        }
    }
    
    // Prepare product details data
    const productDetailsData = productDetails.map(detail => ({
        title: detail.title,
        description: detail.description
    }));

    // Group images by color
    const variantImagesByColor = this.groupVariantImagesByColor(variantImages, variants);
    console.log('Variant Images Grouped by Color:', Object.keys(variantImagesByColor));

    // ✅ CRITICAL FIX: Create individual variants for EACH color-size combination
    const flattenedVariants = [];

    for (const variantGroup of variants) {
        const { color, sizes = [] } = variantGroup;
        
        console.log(`Processing color "${color}" with ${sizes.length} sizes`);

        // Get images for this color
        const colorImages = variantImagesByColor[color] || [];
        console.log(`Color "${color}": ${colorImages.length} images`);

        let variantImagesData = [];
        
        // Upload variant images if provided for this color
        if (colorImages.length > 0) {
            try {
                console.log(`Uploading ${colorImages.length} images for color "${color}"...`);
                
                const uploadResults = await s3UploadService.uploadMultipleImages(
                    colorImages,
                    `products/${productCode}/variants/${color}`
                );
                
                variantImagesData = uploadResults.map((result, index) => ({
                    imageUrl: result.url,
                    imagePublicId: result.key,
                    isPrimary: index === 0,
                    color: color
                }));
                
                console.log(`✅ Successfully uploaded ${variantImagesData.length} images for "${color}"`);
                
            } catch (uploadError) {
                logger.error('Failed to upload variant images:', uploadError);
                console.error('Upload error:', uploadError);
                throw new Error('Failed to upload variant images');
            }
        } else {
            console.log(`⚠️ No images found for color "${color}"`);
        }

        // ✅ CRITICAL FIX: Create individual variant for EACH size
        for (const sizeObj of sizes) {
            const { size, stock = 0, sku: sizeSku } = sizeObj;
            
            console.log(`  Processing size: "${size}", stock: ${stock}`);

            // Validate size is provided
            if (!size || size.trim() === '') {
                console.warn(`Skipping invalid size for "${color}": ${size}`);
                continue;
            }

            const sku = sizeSku || `${productCode}-${color}-${size}`;

            // Check if SKU already exists
            if (sku) {
                const existingVariant = await prisma.productVariant.findUnique({
                    where: { sku }
                });
                
                if (existingVariant) {
                    throw new Error(`SKU already exists: ${sku}`);
                }
            }

            // Create individual variant with BOTH color and size
            flattenedVariants.push({
                color,
                size: size.trim(),
                stock: parseInt(stock) || 0,
                sku,
                variantImages: {
                    create: variantImagesData // Same images shared across sizes of same color
                }
            });
        }
    }

    console.log('=== Final Flattened Variants Data ===');
    console.log(`Total variants to create: ${flattenedVariants.length}`);
    flattenedVariants.forEach((variant, index) => {
        console.log(`Variant ${index}:`, {
            color: variant.color,
            size: variant.size,
            stock: variant.stock,
            sku: variant.sku,
            imagesCount: variant.variantImages.create.length
        });
    });

    // Validate we have variants
    if (flattenedVariants.length === 0) {
        throw new Error('No valid variants with sizes');
    }

    // Create product with all variants
    const product = await prisma.product.create({
        data: {
            name,
            productCode,
            description,
            normalPrice: parseFloat(normalPrice),
            offerPrice: offerPrice ? parseFloat(offerPrice) : null,
            wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
            categoryId,
            subcategoryId: subcategoryId || null,
            productDetails: {
                create: productDetailsData
            },
            variants: {
                create: flattenedVariants
            }
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true
                }
            },
            subcategory: {
                select: {
                    id: true,
                    name: true
                }
            },
            productDetails: true,
            variants: {
                include: {
                    variantImages: true
                }
            }
        }
    });

    logger.info(`Product created: ${product.id} with ${flattenedVariants.length} variants`);
    return product;
}

groupVariantImagesByColor(variantImages, variants) {
    const imagesByColor = {};
    
    // ✅ FIX: Ensure variants is an array
    if (!Array.isArray(variants)) {
        console.log('Variants is not an array in groupVariantImagesByColor');
        return imagesByColor;
    }
    
    // Get unique colors from variants
    const uniqueColors = [...new Set(variants.map(v => v.color))];
    console.log('Unique colors in variants:', uniqueColors);

    variantImages.forEach((image, index) => {
        const fieldName = image.fieldname || '';
        console.log(`Processing image ${index} with fieldname: "${fieldName}"`);

        let assignedColor = null;

        // Method 1: Extract color from fieldname like "variantImages[Red]"
        const colorMatch = fieldName.match(/variantImages\[([^\]]+)\]/);
        if (colorMatch && colorMatch[1]) {
            assignedColor = colorMatch[1];
            console.log(`✅ Assigned to color "${assignedColor}" via fieldname match`);
        }

        // Method 2: Check if fieldname contains any of the color names
        if (!assignedColor) {
            for (const color of uniqueColors) {
                if (fieldName.toLowerCase().includes(color.toLowerCase())) {
                    assignedColor = color;
                    console.log(`✅ Assigned to color "${color}" via fieldname contains`);
                    break;
                }
            }
        }

        if (assignedColor) {
            if (!imagesByColor[assignedColor]) {
                imagesByColor[assignedColor] = [];
            }
            imagesByColor[assignedColor].push(image);
        } else {
            console.log('❌ Could not assign image to any color, fieldname:', fieldName);
            // Assign to first color as fallback
            if (uniqueColors.length > 0) {
                const fallbackColor = uniqueColors[0];
                if (!imagesByColor[fallbackColor]) {
                    imagesByColor[fallbackColor] = [];
                }
                imagesByColor[fallbackColor].push(image);
                console.log(`⚠️ Assigned to fallback color: "${fallbackColor}"`);
            }
        }
    });

    return imagesByColor;
}

async updateProduct(productId, updateData, files = []) {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
            productDetails: true,
            variants: {
                include: {
                    variantImages: true
                }
            }
        }
    });
    
    if (!product) {
        throw new Error('Product not found');
    }
    
    const {
        name,
        description,
        normalPrice,
        offerPrice,
        wholesalePrice,
        categoryId,
        subcategoryId,
        productDetails,
        status,
        variants // This might not be an array!
    } = updateData;
    
    // ✅ FIX: Ensure variants is always an array
    const variantsData = Array.isArray(variants) ? variants : [];
    console.log('Variants data for update:', variantsData);
    
    // Existing category/subcategory validation...
    if (categoryId) {
        const category = await prisma.category.findUnique({
            where: { id: categoryId }
        });
        if (!category) {
            throw new Error('Category not found');
        }
    }
    
    if (subcategoryId) {
        const subcategory = await prisma.subcategory.findUnique({
            where: { id: subcategoryId }
        });
        if (!subcategory) {
            throw new Error('Subcategory not found');
        }
        if (subcategory.categoryId !== categoryId) {
            throw new Error('Subcategory does not belong to the specified category');
        }
    }
    
    // ✅ FIX: Only group images if we have variants data
    let variantImagesByColor = {};
    if (variantsData.length > 0 && files.length > 0) {
        variantImagesByColor = this.groupVariantImagesByColor(files, variantsData);
        console.log('Variant Images for update:', Object.keys(variantImagesByColor));
    }
    
    // Update product data
    const updatePayload = {
        name: name || product.name,
        description: description !== undefined ? description : product.description,
        normalPrice: normalPrice ? parseFloat(normalPrice) : product.normalPrice,
        offerPrice: offerPrice !== undefined ? parseFloat(offerPrice) : product.offerPrice,
        wholesalePrice: wholesalePrice !== undefined ? parseFloat(wholesalePrice) : product.wholesalePrice,
        categoryId: categoryId || product.categoryId,
        subcategoryId: subcategoryId !== undefined ? subcategoryId : product.subcategoryId,
        status: status || product.status,
        updatedAt: new Date()
    };
    
    // Handle product details update if provided
    if (productDetails && Array.isArray(productDetails)) {
        // Delete existing product details
        await prisma.productDetail.deleteMany({
            where: { productId }
        });
        
        // Create new product details
        updatePayload.productDetails = {
            create: productDetails.map(detail => ({
                title: detail.title,
                description: detail.description
            }))
        };
    }
    
    // ✅ FIX: Handle variants update ONLY if variants data is provided
    if (variantsData.length > 0) {
        // Delete existing variants and create new ones
        await prisma.productVariant.deleteMany({
            where: { productId }
        });
        
        const flattenedVariants = [];
        
        for (const variantGroup of variantsData) {
            const { color, sizes = [] } = variantGroup;
            const colorImages = variantImagesByColor[color] || [];
            
            let variantImagesData = [];
            
            // Upload new variant images if provided
            if (colorImages.length > 0) {
                try {
                    const uploadResults = await s3UploadService.uploadMultipleImages(
                        colorImages,
                        `products/${product.productCode}/variants/${color}`
                    );
                    
                    variantImagesData = uploadResults.map((result, index) => ({
                        imageUrl: result.url,
                        imagePublicId: result.key,
                        isPrimary: index === 0,
                        color: color
                    }));
                    
                } catch (uploadError) {
                    logger.error('Failed to upload variant images during update:', uploadError);
                    throw new Error('Failed to upload variant images');
                }
            }
            
            // Create individual variants for each size
            for (const sizeObj of sizes) {
                const { size, stock = 0, sku: sizeSku } = sizeObj;
                
                if (!size || size.trim() === '') {
                    continue;
                }
                
                const sku = sizeSku || `${product.productCode}-${color}-${size}`;
                
                // Check SKU uniqueness (excluding current product's variants)
                if (sku) {
                    const existingVariant = await prisma.productVariant.findFirst({
                        where: { 
                            sku,
                            productId: { not: productId }
                        }
                    });
                    
                    if (existingVariant) {
                        throw new Error(`SKU already exists: ${sku}`);
                    }
                }
                
                flattenedVariants.push({
                    color,
                    size: size.trim(),
                    stock: parseInt(stock) || 0,
                    sku,
                    variantImages: {
                        create: variantImagesData
                    }
                });
            }
        }
        
        // Add variants to update payload
        updatePayload.variants = {
            create: flattenedVariants
        };
    }
    
    const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: updatePayload,
        include: {
            category: {
                select: {
                    id: true,
                    name: true
                }
            },
            subcategory: {
                select: {
                    id: true,
                    name: true
                }
            },
            productDetails: true,
            variants: {
                include: {
                    variantImages: {
                        orderBy: {
                            isPrimary: 'desc'
                        }
                    }
                }
            }
        }
    });
    
    logger.info(`Product updated: ${productId}`);
    return updatedProduct;
}
  
    // Delete product - UPDATED: Remove product image deletion
    async deleteProduct(productId) {
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                // REMOVED: images include
                variants: {
                    include: {
                        variantImages: true
                    }
                },
                orderItems: true
            }
        });
        
        if (!product) {
            throw new Error('Product not found');
        }
        
        // Check if product has orders
        if (product.orderItems.length > 0) {
            throw new Error('Cannot delete product with existing orders');
        }
        
        // Delete variant images from S3
        for (const variant of product.variants) {
            for (const variantImage of variant.variantImages) {
                if (variantImage.imagePublicId) {
                    try {
                        await s3UploadService.deleteImage(variantImage.imagePublicId);
                    } catch (error) {
                        logger.error('Failed to delete variant image from S3:', error);
                    }
                }
            }
        }
        
        await prisma.product.delete({
            where: { id: productId }
        });
        
        logger.info(`Product deleted: ${productId}`);
    }
  
    // REMOVED: All product image related methods:
    // - addProductImages()
    // - removeProductImage()
    // - setPrimaryProductImage()
  
    // Add product variant - UPDATED: Only variant images
    async addProductVariant(productId, variantData, files = []) {
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });
        
        if (!product) {
            throw new Error('Product not found');
        }
        
        const { color, size, stock = 0, sku } = variantData;
        
        // Check if variant with same color and size already exists
        const existingVariant = await prisma.productVariant.findFirst({
            where: {
                productId,
                color,
                size
            }
        });
        
        if (existingVariant) {
            throw new Error('Variant with same color and size already exists');
        }
        
        // Check if SKU already exists
        if (sku) {
            const existingSku = await prisma.productVariant.findFirst({
                where: {
                    sku,
                    productId: { not: productId }
                }
            });
            
            if (existingSku) {
                throw new Error('SKU already exists');
            }
        }
        
        const generatedSku = sku || `${product.productCode}-${color}-${size}`;
        
        // Upload variant images if provided
        let variantImages = [];
        if (files.length > 0) {
            try {
                const uploadResults = await s3UploadService.uploadMultipleImages(
                    files,
                    `products/${product.productCode}/variants/${color}`
                );
                variantImages = uploadResults.map((result, index) => ({
                    imageUrl: result.url,
                    imagePublicId: result.key,
                    isPrimary: index === 0,
                    color: color
                }));
            } catch (uploadError) {
                logger.error('Failed to upload variant images:', uploadError);
                throw new Error('Failed to upload variant images');
            }
        }
        
        const variant = await prisma.productVariant.create({
            data: {
                productId,
                color,
                size,
                stock: parseInt(stock),
                sku: generatedSku,
                variantImages: {
                    create: variantImages
                }
            },
            include: {
                variantImages: {
                    orderBy: {
                        isPrimary: 'desc'
                    }
                }
            }
        });
        
        const updatedProduct = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                variants: {
                    include: {
                        variantImages: {
                            orderBy: {
                                isPrimary: 'desc'
                            }
                        }
                    }
                }
            }
        });
        
        logger.info(`Product variant added: ${productId}, variantId: ${variant.id}`);
        return updatedProduct;
    }
  
    // Update product variant - UPDATED: Only variant images
    async updateProductVariant(productId, variantId, variantData, files = []) {
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: {
                variantImages: true
            }
        });
        
        if (!variant || variant.productId !== productId) {
            throw new Error('Product variant not found');
        }
        
        const { color, size, stock, sku } = variantData;
        
        // Check if variant with same color and size already exists (excluding current variant)
        if (color && size && (color !== variant.color || size !== variant.size)) {
            const existingVariant = await prisma.productVariant.findFirst({
                where: {
                    productId,
                    color,
                    size,
                    id: { not: variantId }
                }
            });
            
            if (existingVariant) {
                throw new Error('Variant with same color and size already exists');
            }
        }
        
        // Check if SKU already exists (excluding current variant)
        if (sku && sku !== variant.sku) {
            const existingSku = await prisma.productVariant.findFirst({
                where: {
                    sku,
                    id: { not: variantId }
                }
            });
            
            if (existingSku) {
                throw new Error('SKU already exists');
            }
        }
        
        // Upload new variant images if provided
        let newVariantImages = [];
        if (files.length > 0) {
            try {
                const uploadResults = await s3UploadService.uploadMultipleImages(
                    files,
                    `products/${productId}/variants/${color || variant.color}`
                );
                newVariantImages = uploadResults.map(result => ({
                    imageUrl: result.url,
                    imagePublicId: result.key,
                    isPrimary: false,
                    color: color || variant.color
                }));
            } catch (uploadError) {
                logger.error('Failed to upload variant images:', uploadError);
                throw new Error('Failed to upload variant images');
            }
        }
        
        const updatedVariant = await prisma.productVariant.update({
            where: { id: variantId },
            data: {
                color: color || variant.color,
                size: size || variant.size,
                stock: stock !== undefined ? parseInt(stock) : variant.stock,
                sku: sku || variant.sku,
                updatedAt: new Date(),
                ...(newVariantImages.length > 0 && {
                    variantImages: {
                        create: newVariantImages
                    }
                })
            },
            include: {
                variantImages: {
                    orderBy: {
                        isPrimary: 'desc'
                    }
                }
            }
        });
        
        const updatedProduct = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                variants: {
                    include: {
                        variantImages: {
                            orderBy: {
                                isPrimary: 'desc'
                            }
                        }
                    }
                }
            }
        });
        
        logger.info(`Product variant updated: ${productId}, variantId: ${variantId}`);
        return updatedProduct;
    }
  
    // Remove product variant
    async removeProductVariant(productId, variantId) {
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: {
                variantImages: true,
                orderItems: true
            }
        });
        
        if (!variant || variant.productId !== productId) {
            throw new Error('Product variant not found');
        }
        
        // Check if variant has orders
        if (variant.orderItems.length > 0) {
            throw new Error('Cannot delete variant with existing orders');
        }
        
        // Delete variant images from S3
        for (const variantImage of variant.variantImages) {
            if (variantImage.imagePublicId) {
                try {
                    await s3UploadService.deleteImage(variantImage.imagePublicId);
                } catch (error) {
                    logger.error('Failed to delete variant image from S3:', error);
                }
            }
        }
        
        await prisma.productVariant.delete({
            where: { id: variantId }
        });
        
        const updatedProduct = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                variants: {
                    include: {
                        variantImages: {
                            orderBy: {
                                isPrimary: 'desc'
                            }
                        }
                    }
                }
            }
        });
        
        logger.info(`Product variant removed: ${productId}, variantId: ${variantId}`);
        return updatedProduct;
    }
  
    // Add variant images
    async addVariantImages(productId, variantId, files) {
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId }
        });
        
        if (!variant || variant.productId !== productId) {
            throw new Error('Product variant not found');
        }
        
        let newVariantImages = [];
        if (files.length > 0) {
            try {
                const uploadResults = await s3UploadService.uploadMultipleImages(
                    files,
                    `products/${productId}/variants/${variant.color}`
                );
                newVariantImages = uploadResults.map(result => ({
                    imageUrl: result.url,
                    imagePublicId: result.key,
                    isPrimary: false,
                    color: variant.color
                }));
            } catch (uploadError) {
                logger.error('Failed to upload variant images:', uploadError);
                throw new Error('Failed to upload variant images');
            }
        }
        
        const updatedVariant = await prisma.productVariant.update({
            where: { id: variantId },
            data: {
                variantImages: {
                    create: newVariantImages
                },
                updatedAt: new Date()
            },
            include: {
                variantImages: {
                    orderBy: {
                        isPrimary: 'desc'
                    }
                }
            }
        });
        
        logger.info(`Variant images added: ${variantId}, count: ${newVariantImages.length}`);
        return updatedVariant;
    }
  
    // Remove variant image
    async removeVariantImage(productId, variantId, imageId) {
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: {
                variantImages: true
            }
        });
        
        if (!variant || variant.productId !== productId) {
            throw new Error('Product variant not found');
        }
        
        const variantImage = variant.variantImages.find(img => img.id === imageId);
        if (!variantImage) {
            throw new Error('Variant image not found');
        }
        
        // Delete image from S3
        if (variantImage.imagePublicId) {
            try {
                await s3UploadService.deleteImage(variantImage.imagePublicId);
            } catch (error) {
                logger.error('Failed to delete variant image from S3:', error);
                throw new Error('Failed to remove variant image');
            }
        }
        
        // If this was the primary image, set another image as primary
        let setNewPrimary = false;
        if (variantImage.isPrimary && variant.variantImages.length > 1) {
            setNewPrimary = true;
        }
        
        // Delete the image
        await prisma.productVariantImage.delete({
            where: { id: imageId }
        });
        
        // Set new primary image if needed
        if (setNewPrimary) {
            const remainingImages = await prisma.productVariantImage.findMany({
                where: { variantId },
                orderBy: { createdAt: 'asc' }
            });
            
            if (remainingImages.length > 0) {
                await prisma.productVariantImage.update({
                    where: { id: remainingImages[0].id },
                    data: { isPrimary: true }
                });
            }
        }
        
        const updatedVariant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: {
                variantImages: {
                    orderBy: {
                        isPrimary: 'desc'
                    }
                }
            }
        });
        
        logger.info(`Variant image removed: ${variantId}, imageId: ${imageId}`);
        return updatedVariant;
    }
  
    // Set primary variant image
    async setPrimaryVariantImage(productId, variantId, imageId) {
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: {
                variantImages: true
            }
        });
        
        if (!variant || variant.productId !== productId) {
            throw new Error('Product variant not found');
        }
        
        const variantImage = variant.variantImages.find(img => img.id === imageId);
        if (!variantImage) {
            throw new Error('Variant image not found');
        }
        
        // Reset all variant images to non-primary
        await prisma.productVariantImage.updateMany({
            where: { variantId },
            data: { isPrimary: false }
        });
        
        // Set the selected image as primary
        await prisma.productVariantImage.update({
            where: { id: imageId },
            data: { isPrimary: true }
        });
        
        const updatedVariant = await prisma.productVariant.findUnique({
            where: { id: variantId },
            include: {
                variantImages: {
                    orderBy: {
                        isPrimary: 'desc'
                    }
                }
            }
        });
        
        logger.info(`Primary variant image set: ${variantId}, imageId: ${imageId}`);
        return updatedVariant;
    }
  
    // Update variant stock
    async updateVariantStock(productId, variantId, stock) {
        const variant = await prisma.productVariant.findUnique({
            where: { id: variantId }
        });
        
        if (!variant || variant.productId !== productId) {
            throw new Error('Product variant not found');
        }
        
        const updatedVariant = await prisma.productVariant.update({
            where: { id: variantId },
            data: {
                stock: parseInt(stock),
                updatedAt: new Date()
            }
        });
        
        logger.info(`Variant stock updated: ${variantId}, stock: ${stock}`);
        return updatedVariant;
    }
  
    // Get product statistics
    async getProductStats() {
        const [
            totalProducts,
            activeProducts,
            outOfStockProducts,
            productsWithVariants,
            totalVariants,
            lowStockVariants,
            categoriesWithProducts,
            averagePrice
        ] = await Promise.all([
            prisma.product.count(),
            prisma.product.count({ where: { status: 'ACTIVE' } }),
            prisma.product.count({ where: { status: 'OUT_OF_STOCK' } }),
            prisma.product.count({
                where: {
                    variants: {
                        some: {}
                    }
                }
            }),
            prisma.productVariant.count(),
            prisma.productVariant.count({ where: { stock: { lt: 10 } } }),
            prisma.category.count({
                where: {
                    products: {
                        some: {
                            status: 'ACTIVE'
                        }
                    }
                }
            }),
            prisma.product.aggregate({
                where: { status: 'ACTIVE' },
                _avg: {
                    normalPrice: true
                }
            })
        ]);
        
        return {
            totalProducts,
            activeProducts,
            inactiveProducts: totalProducts - activeProducts - outOfStockProducts,
            outOfStockProducts,
            productsWithVariants,
            totalVariants,
            lowStockVariants,
            categoriesWithProducts,
            averagePrice: averagePrice._avg.normalPrice || 0
        };
    }
  
    // Search products - UPDATED: Remove product image references
    async searchProducts({
        query,
        categoryId,
        subcategoryId,
        minPrice,
        maxPrice,
        colors,
        sizes,
        page = 1,
        limit = 12
    }) {
        const skip = (page - 1) * limit;
        
        const where = {
            status: 'ACTIVE'
        };
        
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { productCode: { contains: query, mode: 'insensitive' } }
            ];
        }
        
        if (categoryId) {
            where.categoryId = categoryId;
        }
        
        if (subcategoryId) {
            where.subcategoryId = subcategoryId;
        }
        
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.OR = [
                {
                    normalPrice: {
                        ...(minPrice !== undefined && { gte: parseFloat(minPrice) }),
                        ...(maxPrice !== undefined && { lte: parseFloat(maxPrice) })
                    }
                },
                {
                    offerPrice: {
                        ...(minPrice !== undefined && { gte: parseFloat(minPrice) }),
                        ...(maxPrice !== undefined && { lte: parseFloat(maxPrice) })
                    }
                }
            ];
        }
        
        // Filter by variants (color and size)
        if (colors.length > 0 || sizes.length > 0) {
            where.variants = {
                some: {
                    ...(colors.length > 0 && { color: { in: colors } }),
                    ...(sizes.length > 0 && { size: { in: sizes } })
                }
            };
        }
        
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    subcategory: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    // REMOVED: images include
                    variants: {
                        include: {
                            variantImages: {
                                where: { isPrimary: true },
                                take: 1
                            }
                        }
                    },
                    ratings: {
                        where: {
                            isApproved: true
                        },
                        select: {
                            rating: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.product.count({ where })
        ]);
        
        // Calculate average ratings and get available colors and sizes
        const productsWithDetails = products.map(product => {
            const ratings = product.ratings;
            const avgRating = ratings.length > 0 
                ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
                : 0;
            
            // Get unique colors and sizes from variants
            const availableColors = [...new Set(product.variants.map(v => v.color))];
            const availableSizes = [...new Set(product.variants.map(v => v.size))];
            const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
            
            return {
                ...product,
                avgRating: Math.round(avgRating * 10) / 10,
                totalRatings: ratings.length,
                availableColors,
                availableSizes,
                totalStock
            };
        });
        
        // Get available filters
        const availableColors = await prisma.productVariant.findMany({
            where: {
                product: {
                    status: 'ACTIVE',
                    ...(categoryId && { categoryId }),
                    ...(subcategoryId && { subcategoryId })
                }
            },
            distinct: ['color'],
            select: {
                color: true
            }
        });
        
        const availableSizes = await prisma.productVariant.findMany({
            where: {
                product: {
                    status: 'ACTIVE',
                    ...(categoryId && { categoryId }),
                    ...(subcategoryId && { subcategoryId })
                }
            },
            distinct: ['size'],
            select: {
                size: true
            }
        });
        
        return {
            products: productsWithDetails,
            filters: {
                colors: availableColors.map(c => c.color),
                sizes: availableSizes.map(s => s.size)
            },
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Get best seller products
    async getBestSellerProducts(limit = 8) {
        const products = await prisma.product.findMany({
            where: {
                status: 'ACTIVE'
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                variants: {
                    include: {
                        variantImages: {
                            where: { isPrimary: true },
                            take: 1
                        },
                        orderItems: {
                            select: {
                                quantity: true
                            }
                        }
                    }
                },
                ratings: {
                    where: {
                        isApproved: true
                    },
                    select: {
                        rating: true
                    }
                }
            },
            orderBy: {
                // Order by total sales (sum of order items quantities)
                variants: {
                    _count: 'desc'
                }
            },
            take: limit
        });

        // Calculate sales count and average ratings
        const productsWithSales = products.map(product => {
            const totalSales = product.variants.reduce((sum, variant) => {
                return sum + variant.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0);
            }, 0);

            const ratings = product.ratings;
            const avgRating = ratings.length > 0 
                ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
                : 0;

            return {
                ...product,
                totalSales,
                avgRating: Math.round(avgRating * 10) / 10,
                totalRatings: ratings.length
            };
        });

        // Sort by total sales
        return productsWithSales.sort((a, b) => b.totalSales - a.totalSales);
    }

    // Get new arrivals
    async getNewArrivals(limit = 8) {
        const products = await prisma.product.findMany({
            where: {
                status: 'ACTIVE'
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                variants: {
                    include: {
                        variantImages: {
                            where: { isPrimary: true },
                            take: 1
                        }
                    }
                },
                ratings: {
                    where: {
                        isApproved: true
                    },
                    select: {
                        rating: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        // Calculate average ratings
        const productsWithRatings = products.map(product => {
            const ratings = product.ratings;
            const avgRating = ratings.length > 0 
                ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
                : 0;

            return {
                ...product,
                avgRating: Math.round(avgRating * 10) / 10,
                totalRatings: ratings.length
            };
        });

        return productsWithRatings;
    }


// Toggle best seller status
async toggleBestSeller(productId, isBestSeller) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      isBestSeller: Boolean(isBestSeller),
      updatedAt: new Date()
    },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      subcategory: {
        select: {
          id: true,
          name: true
        }
      },
      variants: {
        include: {
          variantImages: {
            orderBy: {
              isPrimary: 'desc'
            }
          }
        }
      }
    }
  });
  
  logger.info(`Product best seller status updated: ${productId}, isBestSeller: ${isBestSeller}`);
  return updatedProduct;
}

// Toggle new arrival status
async toggleNewArrival(productId, isNewArrival) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      isNewArrival: Boolean(isNewArrival),
      updatedAt: new Date()
    },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      subcategory: {
        select: {
          id: true,
          name: true
        }
      },
      variants: {
        include: {
          variantImages: {
            orderBy: {
              isPrimary: 'desc'
            }
          }
        }
      }
    }
  });
  
  logger.info(`Product new arrival status updated: ${productId}, isNewArrival: ${isNewArrival}`);
  return updatedProduct;
}

// Toggle featured status
async toggleFeatured(productId, featured) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: {
      featured: Boolean(featured),
      updatedAt: new Date()
    },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      subcategory: {
        select: {
          id: true,
          name: true
        }
      },
      variants: {
        include: {
          variantImages: {
            orderBy: {
              isPrimary: 'desc'
            }
          }
        }
      }
    }
  });
  
  logger.info(`Product featured status updated: ${productId}, featured: ${featured}`);
  return updatedProduct;
}

// Get best seller products (UPDATED: Using the flag)
async getBestSellerProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      isBestSeller: true
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      variants: {
        include: {
          variantImages: {
            where: { isPrimary: true },
            take: 1
          }
        }
      },
      ratings: {
        where: {
          isApproved: true
        },
        select: {
          rating: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  });

  // Calculate average ratings
  const productsWithRatings = products.map(product => {
    const ratings = product.ratings;
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0;

    return {
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratings.length
    };
  });

  return productsWithRatings;
}

// Get new arrivals (UPDATED: Using the flag)
async getNewArrivals(limit = 8) {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      isNewArrival: true
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      variants: {
        include: {
          variantImages: {
            where: { isPrimary: true },
            take: 1
          }
        }
      },
      ratings: {
        where: {
          isApproved: true
        },
        select: {
          rating: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  });

  // Calculate average ratings
  const productsWithRatings = products.map(product => {
    const ratings = product.ratings;
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0;

    return {
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratings.length
    };
  });

  return productsWithRatings;
}

// Get featured products
async getFeaturedProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      featured: true
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          image: true
        }
      },
      variants: {
        include: {
          variantImages: {
            where: { isPrimary: true },
            take: 1
          }
        }
      },
      ratings: {
        where: {
          isApproved: true
        },
        select: {
          rating: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  });

  // Calculate average ratings
  const productsWithRatings = products.map(product => {
    const ratings = product.ratings;
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
      : 0;

    return {
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratings.length
    };
  });

  return productsWithRatings;
}

// Auto-mark products as new arrivals (products created in last 30 days)
async autoMarkNewArrivals() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Mark products created in last 30 days as new arrivals
  await prisma.product.updateMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      },
      status: 'ACTIVE'
    },
    data: {
      isNewArrival: true
    }
  });

  // Unmark products older than 30 days
  await prisma.product.updateMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo
      }
    },
    data: {
      isNewArrival: false
    }
  });

  logger.info('Auto-marked new arrivals based on creation date');
}

// Auto-update best sellers based on sales
async autoUpdateBestSellers() {
  // Get products with highest sales in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const bestSellingProducts = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      orderItems: {
        some: {
          order: {
            createdAt: {
              gte: thirtyDaysAgo
            },
            paymentStatus: 'PAID'
          }
        }
      }
    },
    include: {
      orderItems: {
        where: {
          order: {
            createdAt: {
              gte: thirtyDaysAgo
            },
            paymentStatus: 'PAID'
          }
        },
        select: {
          quantity: true
        }
      }
    }
  });

  // Calculate total sales for each product
  const productsWithSales = bestSellingProducts.map(product => ({
    ...product,
    totalSales: product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
  }));

  // Sort by sales and take top 20
  const topProducts = productsWithSales
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 20);

  // Reset all best sellers
  await prisma.product.updateMany({
    where: {
      isBestSeller: true
    },
    data: {
      isBestSeller: false
    }
  });

  // Mark top products as best sellers
  if (topProducts.length > 0) {
    await prisma.product.updateMany({
      where: {
        id: {
          in: topProducts.map(p => p.id)
        }
      },
      data: {
        isBestSeller: true
      }
    });
  }

  logger.info(`Auto-updated best sellers: ${topProducts.length} products marked as best sellers`);
}
}

export default new ProductService();