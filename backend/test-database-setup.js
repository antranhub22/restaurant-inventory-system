#!/usr/bin/env node

/**
 * Comprehensive Database Testing Script for Render Deployment
 * Tests database connection, schema, and migration status
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Database Testing Script');
console.log('=========================');

// Environment check
console.log('\n📊 Environment Check:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
}

// Parse database URL
const dbUrl = process.env.DATABASE_URL;
if (dbUrl.includes('postgresql')) {
    console.log('   Database Type: PostgreSQL');
} else if (dbUrl.includes('mysql')) {
    console.log('   Database Type: MySQL');
} else {
    console.log('   Database Type: Unknown');
}

// Check Prisma files
console.log('\n📁 Prisma Files Check:');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
    console.log('   ✅ prisma/schema.prisma exists');
    console.log(`   📦 Size: ${fs.statSync(schemaPath).size} bytes`);
} else {
    console.log('   ❌ prisma/schema.prisma missing');
    
    // Search for schema files
    console.log('   🔍 Searching for schema files...');
    try {
        const findResult = execSync('find . -name "schema.prisma" -type f', { encoding: 'utf8' });
        if (findResult.trim()) {
            console.log('   Found schema files:');
            findResult.trim().split('\n').forEach(file => {
                console.log(`     - ${file}`);
            });
        } else {
            console.log('   No schema.prisma files found');
        }
    } catch (e) {
        console.log('   Search failed:', e.message);
    }
    process.exit(1);
}

// Check migrations directory
const migrationsPath = path.join(__dirname, 'prisma', 'migrations');
if (fs.existsSync(migrationsPath)) {
    const migrations = fs.readdirSync(migrationsPath).filter(f => f !== 'migration_lock.toml');
    console.log(`   ✅ Migrations directory exists (${migrations.length} migrations)`);
    if (migrations.length > 0) {
        console.log('   Latest migrations:');
        migrations.slice(-3).forEach(migration => {
            console.log(`     - ${migration}`);
        });
    }
} else {
    console.log('   ⚠️ No migrations directory found');
}

async function testDatabase() {
    console.log('\n🗄️ Database Connection Test:');
    
    let prisma;
    try {
        prisma = new PrismaClient({
            log: ['error', 'warn'],
        });
        
        console.log('   Connecting to database...');
        await prisma.$connect();
        console.log('   ✅ Database connection successful');
        
        // Test query
        console.log('\n🔍 Database Schema Test:');
        try {
            // Check if User table exists
            const userCount = await prisma.user.count();
            console.log(`   ✅ User table exists (${userCount} users)`);
            
            // Check other key tables
            const tables = ['category', 'supplier', 'item', 'inventory'];
            for (const tableName of tables) {
                try {
                    const count = await prisma[tableName].count();
                    console.log(`   ✅ ${tableName} table exists (${count} records)`);
                } catch (e) {
                    console.log(`   ❌ ${tableName} table missing or error:`, e.message);
                }
            }
            
        } catch (error) {
            console.log('   ❌ Schema test failed:', error.message);
            
            if (error.message.includes('does not exist')) {
                console.log('\n🔄 Attempting to run migrations...');
                try {
                    console.log('   Running prisma migrate deploy...');
                    execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', { 
                        stdio: 'inherit',
                        cwd: __dirname
                    });
                    console.log('   ✅ Migrations completed');
                    
                    // Test again
                    console.log('   Re-testing schema...');
                    const userCount = await prisma.user.count();
                    console.log(`   ✅ User table now exists (${userCount} users)`);
                    
                } catch (migrationError) {
                    console.log('   ❌ Migration failed:', migrationError.message);
                    
                    console.log('   🔄 Trying db push as fallback...');
                    try {
                        execSync('npx prisma db push --schema=./prisma/schema.prisma', { 
                            stdio: 'inherit',
                            cwd: __dirname
                        });
                        console.log('   ✅ Schema push completed');
                        
                        // Test again
                        const userCount = await prisma.user.count();
                        console.log(`   ✅ User table now exists (${userCount} users)`);
                        
                    } catch (pushError) {
                        console.log('   ❌ Schema push also failed:', pushError.message);
                        throw pushError;
                    }
                }
            } else {
                throw error;
            }
        }
        
        // Check admin user
        console.log('\n👤 Admin User Check:');
        try {
            const adminUsers = await prisma.user.findMany({
                where: { role: 'owner' },
                select: { id: true, username: true, email: true, role: true }
            });
            
            if (adminUsers.length > 0) {
                console.log(`   ✅ Found ${adminUsers.length} admin user(s):`);
                adminUsers.forEach(user => {
                    console.log(`     - ${user.username} (${user.email}) - ${user.role}`);
                });
            } else {
                console.log('   ⚠️ No admin users found');
                console.log('   💡 Run setup-admin.js to create admin user');
            }
        } catch (e) {
            console.log('   ❌ Admin check failed:', e.message);
        }
        
        console.log('\n🎉 Database test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Database test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (prisma) {
            await prisma.$disconnect();
        }
    }
}

// Check Prisma client generation
console.log('\n🔧 Prisma Client Check:');
try {
    console.log('   Generating Prisma client...');
    execSync('npx prisma generate --schema=./prisma/schema.prisma', { 
        stdio: 'inherit',
        cwd: __dirname
    });
    console.log('   ✅ Prisma client generated successfully');
} catch (error) {
    console.log('   ❌ Prisma client generation failed:', error.message);
    process.exit(1);
}

// Run database tests
testDatabase().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});