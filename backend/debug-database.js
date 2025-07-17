const { PrismaClient } = require('@prisma/client');

console.log('🔍 RESTAURANT INVENTORY - DATABASE DEBUG');
console.log('==========================================');

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET ✅' : 'NOT SET ❌');

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('  Protocol:', url.protocol);
    console.log('  Host:', url.hostname);
    console.log('  Port:', url.port || 'default');
    console.log('  Database:', url.pathname.substring(1));
    console.log('  SSL Mode:', url.searchParams.get('sslmode') || 'not specified');
    
    // Check if it's a Neon database
    if (url.hostname.includes('neon.tech')) {
      console.log('  Provider: Neon.tech ✅');
    } else if (url.hostname.includes('render.com') || url.hostname.startsWith('dpg-')) {
      console.log('  Provider: Render PostgreSQL ⚠️  (Should use Neon.tech)');
    } else {
      console.log('  Provider: Unknown');
    }
  } catch (error) {
    console.log('  ❌ Invalid DATABASE_URL format:', error.message);
  }
}

// Test database connection
async function testConnection() {
  console.log('\n🔗 Testing Database Connection:');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ Cannot test connection - DATABASE_URL not set');
    return;
  }
  
  const prisma = new PrismaClient({
    log: ['error', 'warn']
  });
  
  try {
    console.log('⏳ Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test simple query
    console.log('⏳ Testing database query...');
    const userCount = await prisma.user.count();
    console.log(`✅ Query successful - Found ${userCount} users`);
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log('   Error Type:', error.constructor.name);
    console.log('   Error Code:', error.code || 'N/A');
    console.log('   Error Message:', error.message);
    
    // Provide specific guidance based on error
    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Check if DATABASE_URL points to Neon.tech (not Render PostgreSQL)');
      console.log('   2. Verify Neon database is running');
      console.log('   3. Check network connectivity');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Check username/password in DATABASE_URL');
      console.log('   2. Reset password in Neon dashboard');
    } else if (error.message.includes('SSL')) {
      console.log('\n💡 Possible solutions:');
      console.log('   1. Add ?sslmode=require to DATABASE_URL');
      console.log('   2. Check SSL configuration');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('\n✅ Database debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n❌ Debug failed:', error.message);
    process.exit(1);
  });