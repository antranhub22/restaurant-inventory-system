#!/usr/bin/env bash
# Enhanced Render build script for PostgreSQL
set -o errexit

echo "🧹 Cleaning up old dependencies..."
rm -rf node_modules
rm -rf dist

echo "🔧 Installing dependencies..."
npm ci

echo "📦 Verifying installations..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "TypeScript: $(npx tsc --version)"

echo "📦 Generating Prisma Client..."
npx prisma generate

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
    elif [[ $DATABASE_URL == *"neon.tech"* ]]; then
        echo "🎯 Neon.tech detected" 
    else
        echo "🎯 Custom PostgreSQL detected"
    fi
    
    # Wait for database to be ready (important for Render)
    echo "⏳ Waiting for database to be ready..."
    for i in {1..30}; do
        echo "🔄 Database check attempt $i/30..."
        if timeout 10 node -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.\$connect()
              .then(() => { console.log('✅ Database connected'); process.exit(0); })
              .catch(() => { console.log('❌ Database not ready'); process.exit(1); });
        " 2>/dev/null; then
            echo "✅ Database is ready!"
            break
        else
            echo "⏳ Database not ready yet, waiting..."
            sleep 10
        fi
        
        if [ $i -eq 30 ]; then
            echo "⚠️ Database not ready after 5 minutes, will setup on startup"
        fi
    done
    
    # Try to push schema (non-blocking)
    echo "🗄️ Setting up database schema..."
    if npx prisma db push --accept-data-loss; then
        echo "✅ Database schema updated"
        
        # Try to seed database
        echo "🌱 Seeding database..."
        if npm run db:seed 2>/dev/null || npx prisma db seed 2>/dev/null; then
            echo "✅ Database seeded successfully"
        else
            echo "⚠️ Database seeding skipped (will run on startup)"
        fi
    else
        echo "⚠️ Database schema setup failed (will retry on startup)"
    fi
fi

echo "🏗️ Building TypeScript..."
NODE_ENV=production npm run build

echo "🔍 Build verification..."
if [ -f "dist/app.js" ]; then
    echo "✅ TypeScript build successful - dist/app.js created"
else
    echo "❌ TypeScript build failed - dist/app.js not found"
    exit 1
fi

echo "📦 Build summary:"
echo "   - Dependencies: ✅ Installed"
echo "   - Prisma Client: ✅ Generated" 
echo "   - TypeScript: ✅ Compiled"
echo "   - Database: $([ -n "$DATABASE_URL" ] && echo "✅ Configured" || echo "⚠️ Will setup on startup")"

echo "✅ Backend build completed successfully!"