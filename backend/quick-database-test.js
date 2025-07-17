#!/usr/bin/env node

/**
 * 🚀 Quick Database Test - Fast connection check
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function quickTest() {
  console.log('🔍 Quick Database Connection Test');
  console.log('=================================');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not set');
    console.log('💡 Set DATABASE_URL in .env file or environment variables');
    return false;
  }
  
  console.log('✅ DATABASE_URL found');
  
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`📍 Testing connection to: ${url.hostname}:${url.port || '5432'}`);
    
    if (url.hostname.startsWith('dpg-')) {
      console.log('🎯 Render PostgreSQL detected');
    }
  } catch (e) {
    console.log('⚠️ Invalid DATABASE_URL format');
  }
  
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Connecting...');
    
    // Test with 10 second timeout
    const testPromise = prisma.$connect().then(() => prisma.$queryRaw`SELECT 1 as test`);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );
    
    await Promise.race([testPromise, timeoutPromise]);
    
    console.log('✅ Database connection successful!');
    console.log('🎉 Your PostgreSQL setup is working');
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    if (error.code === 'P1001') {
      console.log('💡 Database server unreachable - check if service is running');
    } else if (error.message.includes('Timeout')) {
      console.log('💡 Connection timeout - database may be starting up');
    }
    
    await prisma.$disconnect();
    return false;
  }
}

if (require.main === module) {
  quickTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { quickTest };