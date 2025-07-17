require('dotenv').config();

async function testPostgreSQLSchema() {
  console.log('🔍 PostgreSQL Database Schema Verification');
  console.log('==========================================');
  
  // Check DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found');
    console.log('💡 Please set DATABASE_URL to test your PostgreSQL database');
    console.log('');
    console.log('Examples:');
    console.log('  export DATABASE_URL="postgresql://user:pass@localhost:5432/restaurant_inventory"');
    console.log('  export DATABASE_URL="postgresql://user:pass@your-host:5432/database"');
    return;
  }
  
  console.log('✅ DATABASE_URL found');
  
  // Parse DATABASE_URL
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('📊 Database Connection Info:');
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || '5432'}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   User: ${url.username || 'not-specified'}`);
    console.log(`   SSL: ${url.searchParams.get('sslmode') || 'default'}`);
    
    // Detect provider
    if (url.hostname.startsWith('dpg-') && url.hostname.includes('render')) {
      console.log('   🎯 Provider: Render PostgreSQL');
    } else if (url.hostname.includes('neon.tech')) {
      console.log('   🎯 Provider: Neon.tech');
    } else if (url.hostname.includes('supabase')) {
      console.log('   🎯 Provider: Supabase');
    } else if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      console.log('   🎯 Provider: Local PostgreSQL');
    } else {
      console.log('   🎯 Provider: Custom PostgreSQL');
    }
  } catch (e) {
    console.log('❌ Invalid DATABASE_URL format');
    return;
  }
  
  console.log('');
  
  // Test connection using Prisma
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    console.log('🔄 Testing PostgreSQL version...');
    const result = await prisma.$queryRaw`SELECT version(), current_database(), current_user, now() as current_time`;
    const info = result[0];
    
    console.log('📊 PostgreSQL Info:');
    console.log(`   Version: ${info.version.split(' ')[1] || 'Unknown'}`);
    console.log(`   Database: ${info.current_database}`);
    console.log(`   User: ${info.current_user}`);
    console.log(`   Current Time: ${info.current_time}`);
    console.log('');
    
    // Check if tables exist
    console.log('🔍 Checking database tables...');
    
    const tablesQuery = `
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tables = await prisma.$queryRawUnsafe(tablesQuery);
    
    console.log(`📊 Found ${tables.length} table(s) in database:`);
    
    if (tables.length === 0) {
      console.log('❌ No tables found in database');
      console.log('💡 Database schema has not been created yet');
      console.log('');
      console.log('To create schema, run:');
      console.log('   npx prisma db push');
      console.log('   # or');
      console.log('   npx prisma migrate deploy');
    } else {
      tables.forEach(table => {
        console.log(`   ✅ ${table.table_name} (${table.table_type})`);
      });
      
      // Check for our expected tables
      console.log('');
      console.log('🔍 Verifying expected tables...');
      
      const expectedTables = [
        'User', 'Category', 'Supplier', 'Item', 'Inventory', 'InventoryBatch',
        'Transaction', 'DepartmentReconciliation', 'OcrCorrection', 'OcrLearning',
        'Import', 'ImportItem', 'Export', 'ExportItem', 'Return', 'ReturnItem',
        'Department', 'Waste', 'WasteItem', 'Reconciliation', 'ReconciliationItem',
        'OCRFormDraft'
      ];
      
      const existingTableNames = tables.map(t => t.table_name);
      let missingTables = [];
      let presentTables = [];
      
      expectedTables.forEach(tableName => {
        if (existingTableNames.includes(tableName)) {
          presentTables.push(tableName);
          console.log(`   ✅ ${tableName}`);
        } else {
          missingTables.push(tableName);
          console.log(`   ❌ ${tableName} (missing)`);
        }
      });
      
      console.log('');
      console.log('📊 Schema Status Summary:');
      console.log(`   ✅ Present: ${presentTables.length}/${expectedTables.length} tables`);
      
      if (missingTables.length > 0) {
        console.log(`   ❌ Missing: ${missingTables.length} tables`);
        console.log('   Missing tables:', missingTables.join(', '));
        console.log('');
        console.log('💡 To fix missing tables, run:');
        console.log('   npx prisma db push');
        console.log('   # or');
        console.log('   npx prisma migrate deploy');
      } else {
        console.log('   🎉 All expected tables are present!');
      }
    }
    
    // Test application data if tables exist
    if (tables.length > 0) {
      console.log('');
      console.log('🔍 Checking application data...');
      
      try {
        const userCount = await prisma.user.count();
        const categoryCount = await prisma.category.count();
        const supplierCount = await prisma.supplier.count();
        const itemCount = await prisma.item.count();
        const departmentCount = await prisma.department.count();
        
        console.log('📊 Data Summary:');
        console.log(`   Users: ${userCount}`);
        console.log(`   Categories: ${categoryCount}`);
        console.log(`   Suppliers: ${supplierCount}`);
        console.log(`   Items: ${itemCount}`);
        console.log(`   Departments: ${departmentCount}`);
        
        if (userCount === 0) {
          console.log('');
          console.log('💡 No users found. To seed initial data, run:');
          console.log('   npm run db:seed');
        } else {
          console.log('   ✅ Database has been seeded with initial data');
        }
        
      } catch (error) {
        console.log('⚠️ Could not check application data:', error.message);
        console.log('💡 This might indicate missing tables or schema mismatch');
      }
    }
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    console.log('Error code:', error.code);
    
    if (error.code === 'P1001') {
      console.log('💡 Database server unreachable. Check:');
      console.log('   - Database service is running');
      console.log('   - DATABASE_URL is correct');
      console.log('   - Network connectivity');
    } else if (error.code === 'P1000') {
      console.log('💡 Authentication failed. Check:');
      console.log('   - Username/password in DATABASE_URL');
      console.log('   - Database user permissions');
    } else if (error.code === 'P1003') {
      console.log('💡 Database does not exist. Check:');
      console.log('   - Database name in URL');
      console.log('   - Database service completed setup');
    }
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('');
  console.log('✅ PostgreSQL schema verification completed!');
}

// Run the test
testPostgreSQLSchema().catch(console.error);