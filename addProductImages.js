import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addProductImages() {
  try {
    console.log('🔄 Starting to add product images...');

    // Get all products
    const products = await prisma.product.findMany({
      include: {
        images: true
      }
    });

    console.log(`📦 Found ${products.length} total products`);

    const productsWithoutImages = products.filter(product => 
      product.images.length === 0
    );

    console.log(`❌ Found ${productsWithoutImages.length} products without images`);

    if (productsWithoutImages.length === 0) {
      console.log('✅ All products already have images!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const product of productsWithoutImages) {
      try {
        // Create placeholder image URL
        const productInitials = product.name.substring(0, 2).toUpperCase() || 'HG';
        const placeholderImageUrl = `https://via.placeholder.com/600x600/2d5e2d/ffffff?text=${productInitials}`;

        // Add image to product
        await prisma.productImage.create({
          data: {
            productId: product.id,
            imageUrl: placeholderImageUrl,
            isPrimary: true
          }
        });

        console.log(`✅ Added image to: ${product.name}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to add image to ${product.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Summary:`);
    console.log(`✅ Successfully added images to: ${successCount} products`);
    console.log(`❌ Failed to add images to: ${errorCount} products`);
    console.log(`📊 Total processed: ${productsWithoutImages.length} products`);

  } catch (error) {
    console.error('💥 Script failed:', error);
  } finally {
    // Properly disconnect Prisma
    await prisma.$disconnect();
    console.log('🔌 Database connection closed properly');
    process.exit(0); // Exit cleanly
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Script interrupted by user');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Script terminated');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the script
addProductImages();