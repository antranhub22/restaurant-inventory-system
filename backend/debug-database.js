const { PrismaClient } = require('@prisma/client');

console.log('🔍 Database Debug Information');
console.log('=================================');

// Environment info
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('⏰ Timestamp:', new Date().toISOString());

// Check DATABASE_URL
console.log('\n📋 Database URL Check:');
if (process.env.DATABASE_URL) {
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    console.log('✅ DATABASE_URL is set and valid');
    console.log('   Protocol:', dbUrl.protocol);
    console.log('   Host:', dbUrl.hostname);
    console.log('   Port:', dbUrl.port || '5432');
    console.log('   Database:', dbUrl.pathname.slice(1) || 'default');
    console.log('   Username:', dbUrl.username || 'not set');
    console.log('   Password:', dbUrl.password ? '***' : 'not set');
    
    // Check SSL mode
    const sslMode = dbUrl.searchParams.get('sslmode');
    console.log('   SSL Mode:', sslMode || 'default');
    
    // Identify provider
    if (dbUrl.hostname.includes('neon.tech')) {
      console.log('   Provider: Neon.tech');
    } else if (dbUrl.hostname.startsWith('dpg-') && dbUrl.hostname.includes('render')) {
      console.log('   Provider: Render PostgreSQL ✅');
    } else if (dbUrl.hostname === 'localhost' || dbUrl.hostname === '127.0.0.1') {
      console.log('   Provider: Local PostgreSQL');
    } else {
      console.log('   Provider: Custom PostgreSQL');
    }
    
  } catch (error) {
    console.log('❌ DATABASE_URL format invalid:', error.message);
  }
} else {
  console.log('❌ DATABASE_URL not set');
}

// Check other environment variables
console.log('\n📋 Other Environment Variables:');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'not set');
console.log('   REDIS_URL:', process.env.REDIS_URL ? 'set' : 'not set');
console.log('   GOOGLE_CLOUD_PROJECT_ID:', process.env.GOOGLE_CLOUD_PROJECT_ID || 'not set');
console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'not set');

// Test database connection
async function testConnection() {
  console.log('\n🔄 Testing Database Connection...');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ Cannot test - DATABASE_URL not set');
    return;
  }
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    console.log('   Attempting to connect...');
    await prisma.$connect();
    console.log('✅ Connection successful');
    
    console.log('   Testing query...');
    const result = await prisma.$queryRaw`SELECT 
      version() as version,
      current_database() as database,
      current_user as user,
      inet_server_addr() as server_ip,
      inet_server_port() as server_port`;
    
    console.log('✅ Query successful');
    console.log('   PostgreSQL Version:', result[0]?.version?.split(' ')[1] || 'Unknown');
    console.log('   Database Name:', result[0]?.database || 'Unknown');
    console.log('   Connected User:', result[0]?.user || 'Unknown');
    console.log('   Server IP:', result[0]?.server_ip || 'Not available');
    console.log('   Server Port:', result[0]?.server_port || 'Not available');
    
    // Test schema
    console.log('\n🔄 Testing Database Schema...');
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name`;
      
      console.log('✅ Schema check successful');
      console.log('   Tables found:', tables.length);
      tables.forEach(table => {
        console.log('   -', table.table_name);
      });
      
      if (tables.length === 0) {
        console.log('⚠️  No tables found - run database migration');
        console.log('   Command: npx prisma db push');
      }
      
    } catch (schemaError) {
      console.log('❌ Schema check failed:', schemaError.message);
    }
    
    // Test application tables
    console.log('\n🔄 Testing Application Tables...');
    try {
      const userCount = await prisma.user.count();
      const itemCount = await prisma.item.count();
      const categoryCount = await prisma.category.count();
      
      console.log('✅ Application tables accessible');
      console.log(`   Users: ${userCount}`);
      console.log(`   Items: ${itemCount}`);
      console.log(`   Categories: ${categoryCount}`);
      
    } catch (appError) {
      console.log('❌ Application tables error:', appError.message);
      console.log('   This might indicate missing migrations');
    }
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('   Error Code:', error.code);
    
    // Provide specific troubleshooting
    if (error.code === 'P1001') {
      console.log('\n💡 Troubleshooting P1001 (Cannot reach database):');
      console.log('   - Database server may be offline or starting up');
      console.log('   - Check if hostname/port are correct');
      console.log('   - Verify network connectivity');
      console.log('   - For Render: Database startup can take 2-3 minutes');
    } else if (error.code === 'P1000') {
      console.log('\n💡 Troubleshooting P1000 (Authentication failed):');
      console.log('   - Check username and password');
      console.log('   - Verify database user exists and has permissions');
    } else if (error.code === 'P1009') {
      console.log('\n💡 Troubleshooting P1009 (Database does not exist):');
      console.log('   - Check database name in URL');
      console.log('   - Create database if it doesn\'t exist');
    } else if (error.code === 'P1011') {
      console.log('\n💡 Troubleshooting P1011 (TLS/SSL error):');
      console.log('   - Try adding ?sslmode=require to DATABASE_URL');
      console.log('   - Or try ?sslmode=disable for local development');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().catch(console.error);