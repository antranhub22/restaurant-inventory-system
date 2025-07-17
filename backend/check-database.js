require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  console.log('🔍 Database Connection Checker');
  console.log('================================');
  
  // Check environment variables
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('\n📝 Expected format:');
    console.log('DATABASE_URL="postgresql://username:password@host:port/database"');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL is set');
  
  // Parse URL to check format
  try {
    const url = new URL(DATABASE_URL);
    console.log('📊 Database Connection Details:');
    console.log(`   Protocol: ${url.protocol}`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || '5432'}`);
    console.log(`   Database: ${url.pathname.replace('/', '')}`);
    console.log(`   Username: ${url.username}`);
    console.log(`   Password: ${url.password ? '[SET]' : '[NOT SET]'}`);
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error.message);
    console.log('\n📝 Correct format:');
    console.log('DATABASE_URL="postgresql://username:password@host:port/database"');
    process.exit(1);
  }
  
  // Test connection
  const prisma = new PrismaClient();
  
  try {
    console.log('\n🔄 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test query
    console.log('🔄 Testing database query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful!');
    
    // Check if tables exist
    console.log('🔄 Checking database schema...');
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database schema ready - Found ${userCount} users`);
    } catch (error) {
      console.log('⚠️  Database schema not initialized');
      console.log('💡 Run: npx prisma db push');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Check if database service is running on Render');
      console.log('2. Verify DATABASE_URL format');
      console.log('3. Check firewall/network connectivity');
      console.log('4. Ensure database service is in same region');
    }
    
    if (error.message.includes('authentication failed')) {
      console.log('\n🔧 Authentication issue:');
      console.log('1. Check username and password in DATABASE_URL');
      console.log('2. Verify database user permissions');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n🎉 Database check completed successfully!');
}

checkDatabase().catch((error) => {
  console.error('❌ Database check failed:', error);
  process.exit(1);
});