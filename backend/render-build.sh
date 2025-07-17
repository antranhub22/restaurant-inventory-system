#!/usr/bin/env bash
# Simplified and reliable Render build script
set -e

echo "🔨 Building Restaurant Inventory System for Render..."
echo "=================================================="

# Environment info
echo "📊 Build Environment:"
echo "   Node version: $(node --version)"
echo "   NPM version: $(npm --version)"
echo "   Working directory: $(pwd)"
echo "   Process ID: $$"

# Ensure we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are we in the backend directory?"
    echo "📂 Current directory contents:"
    ls -la
    exit 1
fi

# Clean install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci --production=false

# Verify Prisma schema exists
echo ""
echo "🔍 Verifying Prisma schema..."
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Prisma schema not found at prisma/schema.prisma"
    echo "📂 Looking for schema files..."
    find . -name "schema.prisma" -type f || echo "No schema.prisma found anywhere"
    exit 1
fi

echo "✅ Prisma schema found"

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Build TypeScript
echo ""
echo "🏗️ Compiling TypeScript..."
npx tsc

# Verify build output exists
echo ""
echo "✅ Verifying build output..."
if [ ! -f "dist/server.js" ]; then
    echo "❌ dist/server.js not found after build!"
    echo "📂 Dist directory contents:"
    ls -la dist/ 2>/dev/null || echo "dist/ directory doesn't exist"
    exit 1
fi

echo "✅ dist/server.js created successfully"

# Copy Prisma files to dist (needed for deployment)
echo ""
echo "📁 Copying Prisma files to dist..."
mkdir -p dist/prisma
cp -r prisma/* dist/prisma/

# Create simple production start script
echo ""
echo "📝 Creating production start script..."
cat > dist/start-production.js << 'EOF'
// Simple production starter
console.log('🚀 Starting Restaurant Inventory System...');
require('./server.js');
EOF

# List final build structure
echo ""
echo "📂 Final build structure:"
echo "   dist/server.js: $(test -f dist/server.js && echo '✅ exists' || echo '❌ missing')"
echo "   dist/prisma/schema.prisma: $(test -f dist/prisma/schema.prisma && echo '✅ exists' || echo '❌ missing')"
echo "   node_modules/.prisma/client: $(test -d node_modules/.prisma/client && echo '✅ exists' || echo '❌ missing')"

echo ""
echo "✅ Build completed successfully!"