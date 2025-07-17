const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function checkAndMigrate() {
  console.log('🔍 Checking database status...');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    console.error('💡 On Render: Connect PostgreSQL service to your web service');
    console.error('💡 In development: Create .env file with DATABASE_URL');
    process.exit(1);
  }
  
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if schema exists
    console.log('📊 Checking database schema...');
    try {
      await prisma.user.count();
      console.log('✅ Database schema exists and is ready');
    } catch (error) {
      if (error.code === 'P2021' || error.message.includes('does not exist')) {
        console.log('⚠️ Database schema missing - running migrations...');
        
        try {
          console.log('🔄 Running migrations...');
          execSync('npx prisma migrate deploy', { stdio: 'inherit' });
          console.log('✅ Migrations completed successfully');
          
          // Verify schema again
          const userCount = await prisma.user.count();
          console.log(`✅ Database ready - Users: ${userCount}`);
          
        } catch (migrationError) {
          console.error('❌ Migration failed:', migrationError.message);
          process.exit(1);
        }
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('💡 Error code:', error.code);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('🎉 Database is ready!');
}

checkAndMigrate().catch(console.error);