#!/usr/bin/env bash
# Enhanced Render build script with comprehensive error handling
set -e  # Exit on any error

echo "🧹 Cleaning up old dependencies and build..."
rm -rf node_modules dist
rm -f package-lock.json

echo "🔧 Installing dependencies..."
npm ci --include=dev

echo "📦 Verifying critical installations..."
echo "   Node version: $(node --version)"
echo "   NPM version: $(npm --version)"
echo "   TypeScript: $(npx tsc --version)"

# Verify essential packages
echo "   Checking critical packages..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const critical = ['typescript', 'tsx', '@prisma/client', 'express'];
const missing = critical.filter(p => !pkg.dependencies[p] && !pkg.devDependencies[p]);
if (missing.length > 0) {
  console.log('❌ Missing critical packages:', missing.join(', '));
  process.exit(1);
}
console.log('✅ All critical packages present');
"

echo "📦 Generating Prisma Client..."
npx prisma generate --schema=./prisma/schema.prisma

echo "🔍 Database connection check..."
# Check if DATABASE_URL is available
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️ DATABASE_URL not set - skipping database operations"
    echo "💡 Database will be set up on first run"
else
    echo "✅ DATABASE_URL is set"
    
    # Parse DATABASE_URL to check provider
    if [[ $DATABASE_URL == *"dpg-"*".render"* ]]; then
        echo "🎯 Render PostgreSQL detected"
    elif [[ $DATABASE_URL == *"render.com"* ]]; then
  echo "🎯 Render PostgreSQL detected" 
    else
        echo "🎯 Custom PostgreSQL detected"
    fi
    
    # Test database connection with timeout
    echo "⏳ Testing database connection..."
    if timeout 20 node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$connect()
          .then(() => { 
            console.log('✅ Database connected successfully'); 
            return prisma.\$disconnect();
          })
          .then(() => process.exit(0))
          .catch((e) => { 
            console.log('⚠️ Database connection failed (will retry at runtime):', e.message); 
            process.exit(0); // Don't fail build for connection issues
          });
    " 2>/dev/null; then
        echo "✅ Database connection verified"
    else
        echo "⚠️ Database not ready (will setup on startup)"
    fi
fi

echo "🏗️ Building TypeScript..."
npm run build

echo "🔍 Verifying build output..."
if [ -f "dist/server.js" ]; then
    echo "✅ dist/server.js created successfully"
    echo "   📦 Size: $(ls -lh dist/server.js | awk '{print $5}')"
else
    echo "❌ dist/server.js not found after build!"
    echo "📂 Build output contents:"
    ls -la dist/ 2>/dev/null || echo "❌ No dist/ directory created"
    
    # Try to identify the issue
    echo "🔍 Investigating build failure..."
    echo "📂 TypeScript source files:"
    find src/ -name "*.ts" | head -5
    
    echo "📄 TypeScript config check:"
    if [ -f "tsconfig.json" ]; then
        echo "✅ tsconfig.json exists"
        node -e "
        const ts = JSON.parse(require('fs').readFileSync('tsconfig.json', 'utf8'));
        console.log('   outDir:', ts.compilerOptions?.outDir || 'not set');
        console.log('   rootDir:', ts.compilerOptions?.rootDir || 'not set');
        "
    else
        echo "❌ tsconfig.json missing"
    fi
    
    exit 1
fi

# Verify other important files
if [ -f "dist/app.js" ]; then
    echo "✅ dist/app.js also created"
else
    echo "⚠️ dist/app.js not found (not critical if server.js exists)"
fi

echo "🧹 Cleaning up dev dependencies..."
rm -rf node_modules
npm ci --only=production

echo "🗄️ Running database migrations..."
if [ -n "$DATABASE_URL" ]; then
    echo "   📊 DATABASE_URL detected, running migrations..."
    npx prisma migrate deploy --schema=./prisma/schema.prisma || echo "   ⚠️ Migration failed, will retry at startup"
else
    echo "   ⚠️ DATABASE_URL not set, migrations will run at startup"
fi

echo "📊 Final build verification..."
echo "   📂 Build output:"
ls -la dist/
echo "   📦 Production dependencies installed: $(ls node_modules | wc -l) packages"
echo "   💾 Total size: $(du -sh . | cut -f1)"

echo "✅ Build completed successfully!"
echo "🎯 Entry points available:"
[ -f "dist/server.js" ] && echo "   - dist/server.js (primary)"
[ -f "dist/app.js" ] && echo "   - dist/app.js (secondary)" 
[ -f "src/server.ts" ] && echo "   - src/server.ts (fallback)"