#!/usr/bin/env bash
# Simplified and reliable Render startup script
set -e

echo "🚀 Starting Restaurant Inventory System on Render..."
echo "=================================================="

# Environment check
echo "📊 Environment Information:"
echo "   Node version: $(node --version)"
echo "   Working Directory: $(pwd)"
echo "   NODE_ENV: ${NODE_ENV:-not set}"
echo "   PORT: ${PORT:-not set}"

# Verify we're in the right place
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found! Are we in the backend directory?"
    echo "📂 Current directory contents:"
    ls -la
    exit 1
fi

# Verify DATABASE_URL
echo ""
echo "🗄️ Database Configuration:"
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set!"
    exit 1
fi
echo "✅ DATABASE_URL is configured"

# Quick database connection test
echo ""
echo "🔍 Testing database connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.\$connect();
    console.log('✅ Database connection successful');
    await prisma.\$disconnect();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
" || exit 1

# Ensure Prisma client is generated
echo ""
echo "🔧 Ensuring Prisma client is ready..."
if [ ! -d "node_modules/.prisma/client" ]; then
    echo "⚠️ Prisma client not found, generating..."
    npx prisma generate
else
    echo "✅ Prisma client exists"
fi

# Check if tables exist and run migrations if needed
echo ""
echo "📋 Setting up database schema..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    await prisma.\$connect();
    
    // Try to count users (test if tables exist)
    try {
      const userCount = await prisma.user.count();
      console.log('✅ Database tables exist (found ' + userCount + ' users)');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️ Tables do not exist, running migrations...');
        await prisma.\$disconnect();
        process.exit(2); // Signal to run migrations
      } else {
        throw error;
      }
    }
    
    await prisma.\$disconnect();
  } catch (error) {
    console.log('❌ Database setup check failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
"

# If the check returned exit code 2, run migrations
if [ $? -eq 2 ]; then
    echo "🔄 Running database migrations..."
    
    # Try migrate deploy first, then fallback to db push
    if npx prisma migrate deploy; then
        echo "✅ Migrations deployed successfully"
    else
        echo "⚠️ Migrate deploy failed, trying db push..."
        if npx prisma db push --accept-data-loss; then
            echo "✅ Schema pushed successfully"
        else
            echo "❌ Both migration methods failed!"
            exit 1
        fi
    fi
    
    # Verify tables were created
    echo "🔍 Verifying table creation..."
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.user.count()
      .then((count) => { 
        console.log('✅ Tables verified (found ' + count + ' users)'); 
        return prisma.\$disconnect();
      })
      .catch(e => {
        console.log('❌ Table verification failed:', e.message);
        process.exit(1);
      });
    " || exit 1
fi

# Create admin user if none exists
echo ""
echo "👤 Checking for admin user..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    await prisma.\$connect();
    const adminUser = await prisma.user.findFirst({
      where: { role: 'owner' }
    });
    
    if (!adminUser) {
      console.log('⚠️ No admin user found, will create one...');
      process.exit(3); // Signal to create admin
    } else {
      console.log('✅ Admin user exists: ' + adminUser.username);
    }
    
    await prisma.\$disconnect();
  } catch (error) {
    console.log('❌ Admin check failed:', error.message);
    process.exit(1);
  }
}

checkAdmin();
"

# If no admin exists, create one
if [ $? -eq 3 ]; then
    if [ -f "setup-admin.js" ]; then
        echo "🔧 Creating admin user..."
        node setup-admin.js || echo "⚠️ Admin creation failed (continuing anyway)"
    else
        echo "⚠️ setup-admin.js not found, skipping admin creation"
    fi
fi

# Start the application
echo ""
echo "🚀 Starting the application..."

# Check for compiled server file
if [ -f "dist/server.js" ]; then
    echo "✅ Starting from compiled dist/server.js"
    exec node dist/server.js
else
    echo "❌ Compiled server not found!"
    echo "📂 Available files:"
    ls -la dist/ 2>/dev/null || echo "No dist directory"
    exit 1
fi 