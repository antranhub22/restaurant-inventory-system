#!/usr/bin/env bash
# Simplified Render startup script - direct approach
set -e

echo "🚀 STARTING RESTAURANT INVENTORY SYSTEM"
echo "======================================="

# Basic environment check
echo "📊 Environment:"
echo "   PWD: $(pwd)"
echo "   NODE_ENV: ${NODE_ENV:-not set}"
echo "   DATABASE_URL: $(test -n "$DATABASE_URL" && echo 'configured' || echo 'MISSING')"

# Exit if no DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not configured"
    exit 1
fi

# Debug: Show file structure 
echo ""
echo "📂 CURRENT DIRECTORY STRUCTURE:"
ls -la
echo ""

# Check for schema in multiple locations
echo "🔍 SEARCHING FOR PRISMA SCHEMA:"
SCHEMA_FOUND=""

if [ -f "prisma/schema.prisma" ]; then
    echo "✅ Found: ./prisma/schema.prisma"
    SCHEMA_FOUND="./prisma/schema.prisma"
elif [ -f "dist/prisma/schema.prisma" ]; then
    echo "✅ Found: ./dist/prisma/schema.prisma"
    SCHEMA_FOUND="./dist/prisma/schema.prisma"
    # Copy it to expected location
    mkdir -p prisma
    cp dist/prisma/schema.prisma prisma/
    cp -r dist/prisma/migrations prisma/ 2>/dev/null || true
    echo "✅ Copied schema to ./prisma/"
else
    echo "❌ Schema not found, searching..."
    find . -name "schema.prisma" -type f 2>/dev/null || true
fi

# Show prisma directory if exists
if [ -d "prisma" ]; then
    echo ""
    echo "📂 PRISMA DIRECTORY:"
    ls -la prisma/
fi

# Generate Prisma client
echo ""
echo "🔧 GENERATING PRISMA CLIENT:"
if npx prisma generate; then
    echo "✅ Prisma client generated"
else
    echo "❌ Failed to generate client"
    exit 1
fi

# Test database connection
echo ""
echo "🔍 TESTING DATABASE CONNECTION:"
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => { 
    console.log('✅ Database connection OK'); 
    return prisma.\$disconnect(); 
  })
  .catch(e => { 
    console.log('❌ Database connection failed:', e.message); 
    process.exit(1); 
  });
" || exit 1

# Run migrations
echo ""
echo "🔄 SETTING UP DATABASE SCHEMA:"
if npx prisma migrate deploy 2>/dev/null; then
    echo "✅ Migrations deployed"
else
    echo "⚠️ Migrate deploy failed, trying db push..."
    if npx prisma db push --accept-data-loss; then
        echo "✅ Schema pushed with db push"
    else
        echo "⚠️ Migration failed, but continuing..."
    fi
fi

# Verify server file exists
echo ""
echo "🔍 CHECKING SERVER FILE:"
if [ -f "dist/server.js" ]; then
    echo "✅ Server file exists: dist/server.js"
else
    echo "❌ dist/server.js not found"
    echo "📂 dist/ contents:"
    ls -la dist/ 2>/dev/null || echo "No dist directory"
    exit 1
fi

# Start the server
echo ""
echo "🚀 STARTING SERVER..."
echo "   File: dist/server.js"
echo "   Port: ${PORT:-4000}"
echo ""

exec node dist/server.js 