import { PrismaClient } from '@prisma/client';

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database...\n');
    
    // 1. Check available models
    console.log('📋 Available Prisma models:');
    const models = Object.keys(prisma).filter(key => 
      typeof prisma[key] === 'object' && 
      prisma[key].findMany && 
      prisma[key].count
    );
    console.log(models);
    console.log('');
    
    // 2. Check if homeSlider model exists and count records
    if (prisma.homeSlider) {
      console.log('✅ homeSlider model exists');
      const count = await prisma.homeSlider.count();
      console.log(`📊 Total sliders in database: ${count}`);
      
      if (count > 0) {
        const sample = await prisma.homeSlider.findFirst({
          select: { id: true, title: true, isActive: true }
        });
        console.log('📝 Sample slider:', sample);
      }
    } else {
      console.log('❌ homeSlider model not found');
      
      // Check for alternative names
      const alternatives = ['homeSliders', 'home_slider', 'home_sliders'];
      for (const alt of alternatives) {
        if (prisma[alt]) {
          console.log(`🔍 Found alternative: ${alt}`);
          const count = await prisma[alt].count();
          console.log(`📊 Total records in ${alt}: ${count}`);
        }
      }
    }
    
    console.log('');
    
    // 3. Try raw SQL to check table existence
    console.log('🗃️ Checking table existence with raw SQL...');
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;
      console.log('📦 All tables in database:');
      console.log(tables.map(t => t.table_name));
      
      // Check specifically for home_sliders
      const homeSlidersExists = tables.some(t => t.table_name === 'home_sliders');
      console.log(`\n🏠 home_sliders table exists: ${homeSlidersExists}`);
      
    } catch (sqlError) {
      console.log('❌ SQL query failed:', sqlError.message);
    }
    
  } catch (error) {
    console.error('💥 Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();