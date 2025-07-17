require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database connection...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    
    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found');
      console.log('Please set DATABASE_URL environment variable');
      process.exit(1);
    }
    
    // Parse DATABASE_URL
    try {
      const dbUrl = new URL(process.env.DATABASE_URL);
      console.log('📊 Database Info:');
      console.log('   Host:', dbUrl.hostname);
      console.log('   Port:', dbUrl.port || '5432');
      console.log('   Database:', dbUrl.pathname.slice(1));
      console.log('   SSL:', dbUrl.searchParams.get('sslmode') || 'default');
      
      if (dbUrl.hostname.includes('render.com')) {
    console.log('   Provider: Render PostgreSQL');
      } else if (dbUrl.hostname.startsWith('dpg-')) {
        console.log('   Provider: Render PostgreSQL ✅');
      } else if (dbUrl.hostname === 'localhost') {
        console.log('   Provider: Local PostgreSQL');
      } else {
        console.log('   Provider: Custom PostgreSQL');
      }
    } catch (e) {
      console.error('❌ Invalid DATABASE_URL format');
      process.exit(1);
    }
    
    // Test connection
    console.log('\n🔄 Testing connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test query
    console.log('\n🔄 Testing query...');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Query successful');
    console.log('PostgreSQL version:', result[0]?.version?.split(' ')[1] || 'Unknown');
    
    // Check tables
    console.log('\n🔄 Checking tables...');
    const userCount = await prisma.user.count();
    const itemCount = await prisma.item.count();
    console.log(`📊 Tables status:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Items: ${itemCount}`);
    
    console.log('\n✅ Database check completed successfully!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'P1001') {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   - Check if PostgreSQL service is running');
      console.error('   - Verify DATABASE_URL is correct');
      console.error('   - Check network connectivity');
      console.error('   - For Render: Database may be starting up (wait 2-3 minutes)');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();