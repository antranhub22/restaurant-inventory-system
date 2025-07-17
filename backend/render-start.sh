#!/usr/bin/env bash
# Ultra-simplified Render startup script using dedicated Prisma setup
set -e

echo "🚀 Starting Restaurant Inventory System on Render..."
echo "=================================================="

# Environment check
echo "📊 Environment Information:"
echo "   Node version: $(node --version)"
echo "   Working Directory: $(pwd)"
echo "   NODE_ENV: ${NODE_ENV:-not set}"
echo "   PORT: ${PORT:-not set}"

# DEBUG: Check file structure
echo ""
echo "🔍 DEBUG: Checking file structure..."
echo "   Current directory: $(pwd)"
echo "   package.json: $(test -f package.json && echo 'EXISTS' || echo 'MISSING')"
echo "   prisma/schema.prisma: $(test -f prisma/schema.prisma && echo 'EXISTS' || echo 'MISSING')"
echo "   setup-prisma-for-render.js: $(test -f setup-prisma-for-render.js && echo 'EXISTS' || echo 'MISSING')"
echo "   debug-startup.js: $(test -f debug-startup.js && echo 'EXISTS' || echo 'MISSING')"

echo ""
echo "📂 Current directory contents:"
ls -la

if [ -d "prisma" ]; then
    echo ""
    echo "📂 Prisma directory contents:"
    ls -la prisma/
fi

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

# Run comprehensive Prisma setup with debug
echo ""
echo "🔧 Running comprehensive Prisma setup with debug..."

# Check if debug script exists, if not use inline setup
if [ -f "debug-startup.js" ]; then
    echo "📋 Using debug-startup.js..."
    if node debug-startup.js; then
        echo "✅ Prisma setup completed successfully"
    else
        echo "❌ Prisma setup failed!"
        exit 1
    fi
else
    echo "⚠️ debug-startup.js not found, using inline setup..."
    
    # Inline Prisma setup
    echo "🔧 Generating Prisma client..."
    if npx prisma generate; then
        echo "✅ Prisma client generated"
    else
        echo "❌ Failed to generate Prisma client"
        exit 1
    fi
    
    echo "🔄 Running database migrations..."
    if npx prisma migrate deploy; then
        echo "✅ Migrations deployed"
    else
        echo "⚠️ Migrate deploy failed, trying db push..."
        if npx prisma db push --accept-data-loss; then
            echo "✅ Schema pushed"
        else
            echo "❌ Both migration methods failed"
            exit 1
        fi
    fi
fi

# Verify compiled server exists
echo ""
echo "🔍 Checking application files..."
if [ ! -f "dist/server.js" ]; then
    echo "❌ Compiled server not found at dist/server.js!"
    echo "📂 Available files in dist:"
    ls -la dist/ 2>/dev/null || echo "No dist directory"
    exit 1
fi

echo "✅ dist/server.js found"

# Start the application
echo ""
echo "🚀 Starting the application..."
echo "   Entry point: dist/server.js"
echo "   PORT: ${PORT:-4000}"
echo ""

exec node dist/server.js 