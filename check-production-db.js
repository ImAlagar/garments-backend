const { PrismaClient } = require('@prisma/client');

async function checkProductionDatabase() {
  // Use production DATABASE_URL from environment
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  try {
    console.log('🔍 Checking PRODUCTION database...\n');
    
    // 1. Check available models
    console.log('📋 Available Prisma models in production:');
    const models = Object.keys(prisma).filter(key => 
      typeof prisma[key] === 'object' && 
      prisma[key].findMany && 
      prisma[key].count
    );
    console.log(models);
    console.log('');
    
    // 2. Check homeSlider in production
    if (prisma.homeSlider) {
      console.log('✅ homeSlider model exists in production');
      const count = await prisma.homeSlider.count();
      console.log(`📊 Total sliders in PRODUCTION database: ${count}`);
      
      if (count > 0) {
        const sample = await prisma.homeSlider.findFirst({
          select: { id: true, title: true, isActive: true }
        });
        console.log('📝 Sample slider in production:', sample);
      } else {
        console.log('❌ No sliders found in production database');
        
        // List all tables to confirm structure
        const tables = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `;
        console.log('\n📦 All tables in PRODUCTION database:');
        console.log(tables.map(t => t.table_name));
      }
    } else {
      console.log('❌ homeSlider model not found in production');
    }
    
  } catch (error) {
    console.error('💥 Error checking production database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionDatabase();