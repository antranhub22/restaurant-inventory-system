#!/usr/bin/env node
/**
 * Setup Prisma for Render deployment
 * Ensures schema is found and migrations run correctly
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

console.log('🔧 Setting up Prisma for Render deployment...');

async function setupPrisma() {
  try {
    // 1. Find schema.prisma file
    console.log('🔍 Locating Prisma schema...');
    
    const possiblePaths = [
      './prisma/schema.prisma',
      '../prisma/schema.prisma',
      './dist/prisma/schema.prisma',
      '/app/prisma/schema.prisma',
      '/app/backend/prisma/schema.prisma'
    ];
    
    let schemaPath = null;
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        schemaPath = path;
        console.log(`✅ Found schema at: ${path}`);
        break;
      }
    }
    
    if (!schemaPath) {
      throw new Error('❌ Prisma schema not found in any expected location');
    }
    
    // 2. Ensure schema is in the right place
    const targetSchemaPath = './prisma/schema.prisma';
    if (schemaPath !== targetSchemaPath) {
      console.log('📋 Copying schema to standard location...');
      
      // Create prisma directory if it doesn't exist
      if (!fs.existsSync('./prisma')) {
        fs.mkdirSync('./prisma', { recursive: true });
      }
      
      // Copy schema
      fs.copyFileSync(schemaPath, targetSchemaPath);
      console.log('✅ Schema copied to ./prisma/schema.prisma');
    }
    
    // 3. Copy migrations if they exist
    const schemaDir = path.dirname(schemaPath);
    const migrationsDir = path.join(schemaDir, 'migrations');
    
    if (fs.existsSync(migrationsDir)) {
      console.log('📁 Copying migrations...');
      if (!fs.existsSync('./prisma/migrations')) {
        fs.mkdirSync('./prisma/migrations', { recursive: true });
      }
      
      // Copy migrations directory
      await execAsync(`cp -r "${migrationsDir}"/* ./prisma/migrations/`);
      console.log('✅ Migrations copied');
    }
    
    // 4. Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated');
    
    // 5. Test database connection
    console.log('🔍 Testing database connection...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
      await prisma.$disconnect();
    } catch (error) {
      throw new Error(`❌ Database connection failed: ${error.message}`);
    }
    
    // 6. Check if tables exist
    console.log('📋 Checking database schema...');
    const prismaForCheck = new PrismaClient();
    
    try {
      await prismaForCheck.$connect();
      const userCount = await prismaForCheck.user.count();
      console.log(`✅ Database tables exist (found ${userCount} users)`);
      await prismaForCheck.$disconnect();
      return true; // Tables exist
      
    } catch (error) {
      await prismaForCheck.$disconnect();
      
      if (error.message.includes('does not exist')) {
        console.log('⚠️ Database tables do not exist, need to run migrations');
        return false; // Need migrations
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Prisma setup failed:', error.message);
    process.exit(1);
  }
}

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    
    // Try migrate deploy first
    try {
      await execAsync('npx prisma migrate deploy');
      console.log('✅ Migrations deployed successfully');
      return;
    } catch (error) {
      console.log('⚠️ Migrate deploy failed, trying db push...');
    }
    
    // Fallback to db push
    try {
      await execAsync('npx prisma db push --accept-data-loss');
      console.log('✅ Schema pushed successfully');
    } catch (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }
    
    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      const userCount = await prisma.user.count();
      console.log(`✅ Tables verified (found ${userCount} users)`);
      await prisma.$disconnect();
    } catch (error) {
      await prisma.$disconnect();
      throw new Error(`Table verification failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function createAdminUser() {
  try {
    console.log('👤 Checking for admin user...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    const adminUser = await prisma.user.findFirst({
      where: { role: 'owner' }
    });
    
    if (!adminUser) {
      console.log('⚠️ No admin user found, creating one...');
      
      // Try to run setup-admin.js if it exists
      if (fs.existsSync('./setup-admin.js')) {
        await execAsync('node setup-admin.js');
        console.log('✅ Admin user created');
      } else {
        console.log('⚠️ setup-admin.js not found, skipping admin creation');
      }
    } else {
      console.log(`✅ Admin user exists: ${adminUser.username}`);
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.log('⚠️ Admin check/creation failed:', error.message);
    // Don't exit, this is not critical
  }
}

// Main execution
async function main() {
  console.log('📊 Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PWD: process.cwd(),
    DATABASE_URL: process.env.DATABASE_URL ? 'configured' : 'missing'
  });
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not configured');
    process.exit(1);
  }
  
  const tablesExist = await setupPrisma();
  
  if (!tablesExist) {
    await runMigrations();
  }
  
  await createAdminUser();
  
  console.log('✅ Prisma setup completed successfully!');
}

main().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
}); 