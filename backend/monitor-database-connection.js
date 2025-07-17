#!/usr/bin/env node

/**
 * 🔄 Continuous Database Connection Monitor
 * Monitor connection để tìm nguyên nhân P1001 khi database status Available
 */

const { PrismaClient } = require('@prisma/client');

// DATABASE_URL từ user
const YOUR_DATABASE_URL = "postgresql://restaurant_user:mIULcCjBrUiQcEcJipC29hR8dMNnsGQh@dpg-d1lspnvfte5s73dtqok0-a:5432/restaurant_inventory";

async function monitorConnection() {
  console.log('🔄 Continuous Database Connection Monitor');
  console.log('Database Status: Available (confirmed)');
  console.log('========================================\n');
  
  // Phân tích vấn đề có thể
  console.log('📊 Problem Analysis:');
  console.log('✅ Database Status: Available');
  console.log('✅ URL Format: Correct');
  console.log('✅ Internal URL: Yes');
  console.log('❓ Region Matching: Need to verify');
  console.log('❓ Network Timing: Testing...\n');
  
  let attempt = 1;
  let successCount = 0;
  let failCount = 0;
  
  while (attempt <= 10) {
    console.log(`🔄 Attempt ${attempt}/10 - ${new Date().toLocaleTimeString()}`);
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: YOUR_DATABASE_URL
        }
      },
      log: ['error']
    });
    
    const startTime = Date.now();
    
    try {
      // Test với different timeout values
      const timeouts = [5000, 10000, 15000, 30000]; // 5s, 10s, 15s, 30s
      let connected = false;
      
      for (const timeout of timeouts) {
        try {
          console.log(`   Testing with ${timeout/1000}s timeout...`);
          
          const connectionPromise = prisma.$connect();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout ${timeout/1000}s`)), timeout)
          );
          
          await Promise.race([connectionPromise, timeoutPromise]);
          
          const duration = Date.now() - startTime;
          console.log(`   ✅ Success! (${duration}ms)`);
          connected = true;
          successCount++;
          
          // Test query if connected
          try {
            const result = await prisma.$queryRaw`SELECT version(), now()`;
            console.log(`   ✅ Query successful`);
            if (result[0]) {
              console.log(`   📊 PostgreSQL ${result[0].version.split(' ')[1]}`);
            }
          } catch (queryError) {
            console.log(`   ⚠️ Query failed: ${queryError.message}`);
          }
          
          break;
          
        } catch (timeoutError) {
          console.log(`   ❌ ${timeoutError.message}`);
        }
      }
      
      if (!connected) {
        failCount++;
        console.log(`   💀 All timeouts failed`);
      }
      
    } catch (error) {
      failCount++;
      const duration = Date.now() - startTime;
      console.log(`   ❌ Failed (${duration}ms): ${error.message}`);
      
      // Detailed error analysis
      if (error.code === 'P1001') {
        console.log(`   💡 P1001: Server unreachable`);
      }
    } finally {
      await prisma.$disconnect();
    }
    
    console.log(`   📊 Success: ${successCount}, Failed: ${failCount}\n`);
    
    // Wait between attempts
    if (attempt < 10) {
      console.log(`   ⏳ Waiting 10 seconds...\n`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    attempt++;
  }
  
  // Final analysis
  console.log('📊 FINAL ANALYSIS');
  console.log('==================');
  console.log(`Success Rate: ${successCount}/10 (${(successCount/10*100).toFixed(1)}%)`);
  
  if (successCount === 0) {
    console.log('\n❌ CONSISTENT FAILURE - Possible causes:');
    console.log('1. 🎯 REGION MISMATCH: Backend và Database khác region');
    console.log('2. 🔥 FIREWALL/NETWORK: Internal networking issue');
    console.log('3. ⏰ DATABASE STARTUP: Service vừa restart và cần time');
    console.log('4. 🔧 SERVICE ISSUE: Database service có internal problem');
    
    console.log('\n🔧 IMMEDIATE ACTIONS:');
    console.log('1. Check region: Backend service và Database service PHẢI cùng region');
    console.log('2. Restart database service trên Render dashboard');
    console.log('3. Wait 5 minutes sau khi restart');
    console.log('4. Nếu vẫn fail → Recreate database service');
    
  } else if (successCount < 5) {
    console.log('\n⚠️ INTERMITTENT CONNECTION - Possible causes:');
    console.log('1. Network latency issues');
    console.log('2. Database service load');
    console.log('3. Render infrastructure issues');
    
  } else {
    console.log('\n✅ CONNECTION WORKING - Deploy should succeed');
    console.log('Enhanced scripts sẽ handle retry logic automatically');
  }
  
  return successCount > 0;
}

// Function to check region mismatch
function checkRegionMismatch() {
  console.log('\n🌍 REGION CHECK INSTRUCTIONS:');
  console.log('==============================');
  console.log('Database service region: Oregon (US West) - từ hình ảnh');
  console.log('');
  console.log('👉 CHECK BACKEND SERVICE REGION:');
  console.log('1. Vào Render dashboard');
  console.log('2. Click vào backend service');
  console.log('3. Kiểm tra region trong service info');
  console.log('4. Nếu KHÁC Oregon → Đây là nguyên nhân chính!');
  console.log('');
  console.log('🔧 FIX REGION MISMATCH:');
  console.log('Option 1: Recreate backend service ở Oregon region');
  console.log('Option 2: Recreate database service ở same region với backend');
  console.log('');
  console.log('⚠️ Region mismatch là nguyên nhân #1 của P1001 error!');
}

// Run monitor
if (require.main === module) {
  monitorConnection()
    .then((hasSuccess) => {
      checkRegionMismatch();
      
      if (!hasSuccess) {
        console.log('\n🚨 RECOMMEND: Check region mismatch FIRST!');
      }
      
      process.exit(hasSuccess ? 0 : 1);
    })
    .catch((error) => {
      console.error('💀 Monitor failed:', error);
      process.exit(1);
    });
}

module.exports = { monitorConnection };