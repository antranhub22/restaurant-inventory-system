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

# Run comprehensive Prisma setup
echo ""
echo "🔧 Running comprehensive Prisma setup..."
if node setup-prisma-for-render.js; then
    echo "✅ Prisma setup completed successfully"
else
    echo "❌ Prisma setup failed!"
    exit 1
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