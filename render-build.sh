#!/usr/bin/env bash
set -e  # Exit on any error

echo "🏗️ Building Restaurant Inventory System for Render..."
echo "=================================================="

# Environment check
echo "📊 Environment Information:"
echo "   Node version: $(node --version)"
echo "   NPM version: $(npm --version)"
echo "   Working Directory: $(pwd)"

# Install backend dependencies and build
echo ""
echo "📦 Installing Backend Dependencies..."
cd backend
npm ci

echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🏗️ Building TypeScript..."
npm run build

echo ""
echo "✅ Build completed successfully!"
echo "📂 Build output:"
ls -la dist/ || echo "❌ No dist directory found"

# Verify critical files
if [ -f "dist/server.js" ]; then
    echo "✅ dist/server.js created successfully"
else
    echo "❌ dist/server.js not found!"
    exit 1
fi

echo "🎉 Build process completed!"