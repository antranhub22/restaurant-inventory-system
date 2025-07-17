#!/usr/bin/env node

// Fallback entry point for Render deployment
// Redirects to the correct compiled server with proper setup

console.log('🔄 Fallback index.js detected - redirecting to correct entry point...');

const path = require('path');
const fs = require('fs');

// CRITICAL: Ensure we're in the backend directory
process.chdir(__dirname);
console.log('📂 Working directory set to:', process.cwd());

// Debug: Show file structure
console.log('🔍 Backend directory contents:');
try {
    fs.readdirSync('.').forEach(file => console.log(`   - ${file}`));
} catch (e) {
    console.log('   Error reading directory:', e.message);
}

// Setup Prisma schema if needed
function setupPrismaSchema() {
    console.log('🔧 Setting up Prisma schema...');
    
    if (fs.existsSync('./prisma/schema.prisma')) {
        console.log('✅ Prisma schema found at ./prisma/schema.prisma');
        return true;
    }
    
    if (fs.existsSync('./dist/prisma/schema.prisma')) {
        console.log('📋 Found schema in dist, copying to prisma/...');
        try {
            if (!fs.existsSync('./prisma')) {
                fs.mkdirSync('./prisma', { recursive: true });
            }
            
            // Copy schema
            fs.copyFileSync('./dist/prisma/schema.prisma', './prisma/schema.prisma');
            
            // Copy migrations if they exist
            if (fs.existsSync('./dist/prisma/migrations')) {
                fs.mkdirSync('./prisma/migrations', { recursive: true });
                const { execSync } = require('child_process');
                execSync('cp -r ./dist/prisma/migrations/* ./prisma/migrations/', { stdio: 'inherit' });
            }
            
            console.log('✅ Schema copied successfully');
            return true;
        } catch (error) {
            console.log('⚠️ Failed to copy schema:', error.message);
        }
    }
    
    console.log('❌ No Prisma schema found');
    return false;
}

// Generate Prisma client
function generatePrismaClient() {
    try {
        console.log('🔧 Generating Prisma client...');
        const { execSync } = require('child_process');
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log('✅ Prisma client generated');
        return true;
    } catch (error) {
        console.log('⚠️ Failed to generate Prisma client:', error.message);
        return false;
    }
}

// Setup database
function setupDatabase() {
    try {
        console.log('🔄 Setting up database...');
        const { execSync } = require('child_process');
        
        // Try migrate deploy first
        try {
            execSync('npx prisma migrate deploy', { stdio: 'inherit' });
            console.log('✅ Migrations deployed');
        } catch (error) {
            console.log('⚠️ Migrate deploy failed, trying db push...');
            try {
                execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
                console.log('✅ Schema pushed with db push');
            } catch (pushError) {
                console.log('⚠️ Database setup failed, but continuing...', pushError.message);
            }
        }
    } catch (error) {
        console.log('⚠️ Database setup error:', error.message);
    }
}

// Main setup
async function setup() {
    console.log('🚀 Starting comprehensive setup...');
    
    // Setup Prisma
    if (setupPrismaSchema()) {
        generatePrismaClient();
        setupDatabase();
    }
    
    console.log('🎯 Setup completed, starting server...');
}

// Check if compiled version exists
const serverPath = path.join(__dirname, 'dist', 'server.js');
const appPath = path.join(__dirname, 'dist', 'app.js');

if (fs.existsSync(serverPath)) {
    console.log('✅ Found dist/server.js, running setup first...');
    setup().then(() => {
        console.log('✅ Loading dist/server.js...');
        require('./dist/server.js');
    }).catch(error => {
        console.error('❌ Setup failed:', error);
        console.log('⚠️ Attempting to start server anyway...');
        require('./dist/server.js');
    });
} else if (fs.existsSync(appPath)) {
    console.log('✅ Found dist/app.js, running setup first...');
    setup().then(() => {
        console.log('✅ Loading dist/app.js...');
        require('./dist/app.js');
    }).catch(error => {
        console.error('❌ Setup failed:', error);
        console.log('⚠️ Attempting to start server anyway...');
        require('./dist/app.js');
    });
} else {
    console.log('❌ No compiled files found. Running TypeScript directly...');
    
    // Run setup first, then TypeScript
    setup().then(() => {
        try {
            require('tsx/cjs');
            require('./src/server.ts');
        } catch (error) {
            console.error('❌ Failed to run TypeScript:', error.message);
            process.exit(1);
        }
    }).catch(error => {
        console.error('❌ Setup failed:', error);
        console.log('⚠️ Attempting to start TypeScript anyway...');
        try {
            require('tsx/cjs');
            require('./src/server.ts');
        } catch (tsError) {
            console.error('❌ Failed to run TypeScript:', tsError.message);
            process.exit(1);
        }
    });
}