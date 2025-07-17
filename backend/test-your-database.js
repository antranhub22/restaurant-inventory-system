#!/usr/bin/env node

/**
 * 🔍 Test Your Specific Database URL
 * Kiểm tra DATABASE_URL từ Render dashboard của bạn
 */

const { PrismaClient } = require('@prisma/client');

// DATABASE_URL từ hình ảnh của bạn
const YOUR_DATABASE_URL = "postgresql://restaurant_user:mIULcCjBrUiQcEcJipC29hR8dMNnsGQh@dpg-d1lspnvfte5s73dtqok0-a:5432/restaurant_inventory";

async function testYourDatabase() {
  console.log('🔍 Testing Your Render PostgreSQL Database');
  console.log('==========================================');
  
  // Step 1: Analyze the URL
  console.log('📊 Step 1: URL Analysis');
  try {
    const url = new URL(YOUR_DATABASE_URL);
    console.log('✅ URL format is valid');
    console.log(`   Protocol: ${url.protocol}`);
    console.log(`   Username: ${url.username}`);
    console.log(`   Password: ${url.password ? '***' + url.password.slice(-4) : 'not-set'}`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    
    // Verify it's Render PostgreSQL
    if (url.hostname.startsWith('dpg-') && url.hostname.endsWith('-a')) {
      console.log('✅ This is a Render PostgreSQL Internal URL');
    } else {
      console.log('⚠️  This may not be a Render Internal URL');
    }
    
  } catch (error) {
    console.log('❌ Invalid URL format:', error.message);
    return false;
  }
  
  // Step 2: Test Connection
  console.log('\n🔄 Step 2: Testing Connection');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: YOUR_DATABASE_URL
      }
    },
    log: ['error']
  });
  
  try {
    console.log('🔄 Connecting to database...');
    
    // Test with 15 second timeout
    const connectionPromise = prisma.$connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout (15s)')), 15000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ Connection successful!');
    
    // Test query
    console.log('🔄 Testing database query...');
    const result = await prisma.$queryRaw`
      SELECT 
        version() as version,
        current_database() as database,
        current_user as user,
        now() as current_time
    `;
    
    console.log('✅ Query successful!');
    if (result[0]) {
      console.log(`   PostgreSQL Version: ${result[0].version.split(' ')[1] || 'Unknown'}`);
      console.log(`   Database: ${result[0].database}`);
      console.log(`   User: ${result[0].user}`);
      console.log(`   Current Time: ${result[0].current_time}`);
    }
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('Error code:', error.code);
    
    if (error.code === 'P1001') {
      console.log('\n💡 P1001 Analysis:');
      console.log('   This means the database server is unreachable');
      console.log('   Common causes:');
      console.log('   1. Database service is still starting (wait 2-3 minutes)');
      console.log('   2. Database service failed to start');
      console.log('   3. Network connectivity issues');
      console.log('   4. Wrong URL (but your URL format looks correct)');
    } else if (error.code === 'P1000') {
      console.log('\n💡 P1000 Analysis:');
      console.log('   Authentication failed - check username/password');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Timeout Analysis:');
      console.log('   Database is taking too long to respond');
      console.log('   This could mean the service is starting up');
    }
    
    await prisma.$disconnect();
    return false;
  }
  
  // Step 3: Test Schema
  console.log('\n📊 Step 3: Testing Application Schema');
  try {
    // Test if tables exist
    const userCount = await prisma.user.count();
    console.log(`✅ User table exists with ${userCount} records`);
    
    const itemCount = await prisma.item.count();
    console.log(`✅ Item table exists with ${itemCount} records`);
    
    if (userCount === 0) {
      console.log('⚠️  No users found - you may need to run seeding');
    }
    
  } catch (error) {
    console.log('❌ Schema test failed:', error.message);
    console.log('💡 This means your database schema is not set up yet');
    console.log('💡 You need to run: npx prisma db push');
  }
  
  await prisma.$disconnect();
  
  // Step 4: Recommendations
  console.log('\n💡 Step 4: Recommendations');
  console.log('✅ Your DATABASE_URL format is correct');
  console.log('✅ Using Render PostgreSQL Internal URL (good!)');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Make sure your PostgreSQL service is "Available" on Render dashboard');
  console.log('2. Set this DATABASE_URL in your backend service environment variables');
  console.log('3. Deploy your backend with the enhanced scripts');
  console.log('4. Monitor logs for successful connection');
  
  return true;
}

// Step 5: Environment Variable Check
function checkEnvironmentSetup() {
  console.log('\n🔧 Step 5: Environment Setup Check');
  
  const requiredVars = {
    'DATABASE_URL': YOUR_DATABASE_URL,
    'NODE_ENV': 'production',
    'JWT_SECRET': 'your-secure-256-bit-secret',
    'PORT': '10000',
    'FRONTEND_URL': 'https://your-frontend.onrender.com'
  };
  
  console.log('📝 Required Environment Variables for Render:');
  console.log('');
  
  Object.entries(requiredVars).forEach(([key, value]) => {
    console.log(`${key}=${key === 'DATABASE_URL' ? value : value}`);
  });
  
  console.log('');
  console.log('💡 Copy these to your Render backend service Environment tab');
}

// Run the test
if (require.main === module) {
  testYourDatabase()
    .then(() => {
      checkEnvironmentSetup();
      console.log('\n🎉 Database URL test completed!');
    })
    .catch((error) => {
      console.error('💀 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testYourDatabase };