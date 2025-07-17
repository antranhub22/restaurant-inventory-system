#!/usr/bin/env bash
# Enhanced Render build script
set -e

echo "🔨 Building Restaurant Inventory System..."
echo "========================================"

# Environment info
echo "📊 Build Environment:"
echo "   Node version: $(node --version)"
echo "   NPM version: $(npm --version)"
echo "   Working directory: $(pwd)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci

# Copy Prisma schema to ensure it's available
echo ""
echo "📋 Ensuring Prisma schema is in correct location..."
if [ -f "prisma/schema.prisma" ]; then
    echo "✅ Prisma schema found"
    # Ensure prisma directory exists in dist
    mkdir -p dist/prisma
    cp -r prisma/* dist/prisma/ 2>/dev/null || true
    echo "✅ Copied Prisma schema to dist/prisma/"
else
    echo "❌ Prisma schema not found!"
    exit 1
fi

# Generate Prisma Client with explicit schema path
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate --schema=./prisma/schema.prisma

# Build TypeScript
echo ""
echo "🏗️ Building TypeScript..."
npm run build

# Verify build output
echo ""
echo "✅ Build verification:"
if [ -f "dist/server.js" ]; then
    echo "   ✓ dist/server.js exists"
else
    echo "   ✗ dist/server.js missing!"
    exit 1
fi

if [ -f "dist/app.js" ]; then
    echo "   ✓ dist/app.js exists"
else
    echo "   ✗ dist/app.js missing!"
fi

# Copy additional files needed for runtime
echo ""
echo "📁 Copying runtime files..."
cp -r prisma dist/ 2>/dev/null || echo "   ⚠️ Prisma directory already exists in dist"

# List final structure
echo ""
echo "📂 Final build structure:"
ls -la dist/

echo ""
echo "✅ Build completed successfully!"