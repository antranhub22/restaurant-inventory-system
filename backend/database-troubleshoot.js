#!/usr/bin/env node

/**
 * 🔧 Database Troubleshooting Script for Render PostgreSQL
 * Comprehensive diagnostic tool to identify and fix database connection issues
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(level, message, data = '') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'INFO': `${colors.blue}[INFO]${colors.reset}`,
    'SUCCESS': `${colors.green}[SUCCESS]${colors.reset}`,
    'WARNING': `${colors.yellow}[WARNING]${colors.reset}`,
    'ERROR': `${colors.red}[ERROR]${colors.reset}`,
    'DEBUG': `${colors.magenta}[DEBUG]${colors.reset}`
  };
  
  console.log(`${prefix[level]} ${timestamp} ${message}${data ? '\n' + data : ''}`);
}

async function troubleshootDatabase() {
  log('INFO', '🔧 Starting Database Troubleshooting...');
  log('INFO', '=====================================');
  
  // Step 1: Environment Check
  log('INFO', '📊 Step 1: Environment Variables Check');
  
  if (!process.env.DATABASE_URL) {
    log('ERROR', '❌ DATABASE_URL not found in environment variables');
    log('ERROR', '💡 Solution: Set DATABASE_URL in Render environment variables');
    log('ERROR', '   Format: postgresql://user:password@host:port/database');
    return false;
  }
  
  log('SUCCESS', '✅ DATABASE_URL is set');
  
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    
    log('INFO', '📋 Database URL Analysis:');
    console.log(`   Protocol: ${dbUrl.protocol}`);
    console.log(`   Host: ${dbUrl.hostname}`);
    console.log(`   Port: ${dbUrl.port || '5432'}`);
    console.log(`   Database: ${dbUrl.pathname.slice(1)}`);
    console.log(`   Username: ${dbUrl.username || 'not-set'}`);
    console.log(`   Password: ${dbUrl.password ? '***' : 'not-set'}`);
    console.log(`   SSL Mode: ${dbUrl.searchParams.get('sslmode') || 'default'}`);
    
    // Detect provider
    if (dbUrl.hostname.startsWith('dpg-') && dbUrl.hostname.includes('.render.com')) {
      log('SUCCESS', '🎯 Render PostgreSQL detected');
    } else if (dbUrl.hostname.includes('render.com')) {
    log('INFO', '🎯 Render PostgreSQL detected');
    } else if (dbUrl.hostname === 'localhost' || dbUrl.hostname === '127.0.0.1') {
      log('WARNING', '🎯 Local PostgreSQL detected (not suitable for production)');
    } else {
      log('INFO', '🎯 Custom PostgreSQL provider detected');
    }
    
  } catch (error) {
    log('ERROR', '❌ Invalid DATABASE_URL format:', error.message);
    return false;
  }
  
  // Step 2: Network Connectivity Test
  log('INFO', '\n📡 Step 2: Network Connectivity Test');
  
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Test basic connectivity (if available)
    log('INFO', `🔍 Testing connectivity to ${dbUrl.hostname}:${dbUrl.port || '5432'}...`);
    
    // This is a basic check - on Render, internal networking may not allow ping
    log('INFO', '⚠️ Network test skipped (Render internal networking)');
    
  } catch (error) {
    log('WARNING', '⚠️ Network test failed (this may be normal on Render)');
  }
  
  // Step 3: Database Connection Test
  log('INFO', '\n🗄️ Step 3: Database Connection Test');
  
  const prisma = new PrismaClient({
    log: ['error']
  });
  
  const maxRetries = 3;
  let connected = false;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log('INFO', `🔄 Connection attempt ${attempt}/${maxRetries}...`);
      
      // Test connection with timeout
      const connectionPromise = prisma.$connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout (30s)')), 30000)
      );
      
      await Promise.race([connectionPromise, timeoutPromise]);
      
      log('SUCCESS', '✅ Database connection successful');
      connected = true;
      break;
      
    } catch (error) {
      log('ERROR', `❌ Connection attempt ${attempt} failed:`, error.message);
      
      // Specific error analysis
      if (error.code === 'P1001') {
        log('ERROR', '💡 P1001: Database server unreachable');
        log('ERROR', '   Common causes:');
        log('ERROR', '   - Database service is starting (wait 2-3 minutes)');
        log('ERROR', '   - Wrong DATABASE_URL (Internal vs External)');
        log('ERROR', '   - Region mismatch between services');
        log('ERROR', '   - Database service failed to start');
      } else if (error.code === 'P1000') {
        log('ERROR', '💡 P1000: Authentication failed');
        log('ERROR', '   Check username/password in DATABASE_URL');
      } else if (error.code === 'P1003') {
        log('ERROR', '💡 P1003: Database does not exist');
        log('ERROR', '   Check database name in URL');
      } else if (error.message.includes('timeout')) {
        log('ERROR', '💡 Connection timeout');
        log('ERROR', '   Database service may be slow to respond');
      }
      
      if (attempt < maxRetries) {
        log('INFO', `⏳ Waiting 5 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  if (!connected) {
    log('ERROR', '💀 All connection attempts failed');
    await prisma.$disconnect();
    return false;
  }
  
  // Step 4: Database Schema Test
  log('INFO', '\n📋 Step 4: Database Schema Test');
  
  try {
    log('INFO', '🔍 Testing basic database query...');
    const result = await prisma.$queryRaw`SELECT version(), current_database(), current_user`;
    log('SUCCESS', '✅ Database query successful');
    
    if (result[0]) {
      console.log(`   PostgreSQL Version: ${result[0].version.split(' ')[1] || 'Unknown'}`);
      console.log(`   Database: ${result[0].current_database || 'Unknown'}`);
      console.log(`   User: ${result[0].current_user || 'Unknown'}`);
    }
    
  } catch (error) {
    log('ERROR', '❌ Database query failed:', error.message);
  }
  
  // Step 5: Application Schema Test
  log('INFO', '\n📊 Step 5: Application Schema Test');
  
  try {
    log('INFO', '🔍 Checking application tables...');
    
    const tables = ['User', 'Item', 'Supplier', 'Department'];
    const tableCounts = {};
    
    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        tableCounts[table] = count;
        log('SUCCESS', `✅ ${table} table: ${count} records`);
      } catch (error) {
        log('ERROR', `❌ ${table} table: ${error.message}`);
        tableCounts[table] = 'Error';
      }
    }
    
    // Check if we have basic data
    if (tableCounts.User === 0) {
      log('WARNING', '⚠️ No users found - database may need seeding');
      log('INFO', '💡 Run: npm run db:seed');
    }
    
  } catch (error) {
    log('ERROR', '❌ Schema check failed:', error.message);
    log('WARNING', '💡 Database schema may not be initialized');
    log('INFO', '💡 Run: npx prisma db push');
  }
  
  // Step 6: Recommendations
  log('INFO', '\n💡 Step 6: Recommendations');
  
  if (connected) {
    log('SUCCESS', '🎉 Database connection is working!');
    log('INFO', '📋 Next steps:');
    log('INFO', '   1. Deploy your backend service on Render');
    log('INFO', '   2. Check health endpoint: /api/health');
    log('INFO', '   3. Monitor logs for any runtime issues');
  } else {
    log('ERROR', '🚨 Database connection failed');
    log('INFO', '📋 Troubleshooting steps:');
    log('INFO', '   1. Check Render PostgreSQL service status');
    log('INFO', '   2. Verify DATABASE_URL in environment variables');
    log('INFO', '   3. Ensure Internal Database URL is used');
    log('INFO', '   4. Check if services are in same region');
    log('INFO', '   5. Wait 2-3 minutes for database to fully start');
  }
  
  await prisma.$disconnect();
  return connected;
}

// Run the troubleshooting
if (require.main === module) {
  troubleshootDatabase()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💀 Troubleshooting script failed:', error);
      process.exit(1);
    });
}

module.exports = { troubleshootDatabase };