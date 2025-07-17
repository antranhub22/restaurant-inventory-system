#!/usr/bin/env bash
# Fix Prisma path issues in production

echo "🔧 Fixing Prisma path issues..."

# Determine the correct working directory
if [ -f "/app/prisma/schema.prisma" ]; then
    echo "✅ Running in Docker container (/app)"
    cd /app
elif [ -f "./backend/prisma/schema.prisma" ]; then
    echo "✅ Running from root directory"
    cd ./backend
elif [ -f "./prisma/schema.prisma" ]; then
    echo "✅ Already in backend directory"
else
    echo "❌ Cannot find Prisma schema!"
    echo "📂 Current directory: $(pwd)"
    echo "📂 Directory contents:"
    ls -la
    exit 1
fi

echo "📂 Working directory: $(pwd)"
echo "📂 Prisma directory contents:"
ls -la prisma/

# Set environment variable for Prisma
export PRISMA_SCHEMA_PATH="./prisma/schema.prisma"
echo "✅ PRISMA_SCHEMA_PATH set to: $PRISMA_SCHEMA_PATH"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations if needed
if [ "$1" == "--migrate" ]; then
    echo "🔄 Running database migrations..."
    npx prisma migrate deploy || npx prisma db push
fi

echo "✅ Prisma setup completed!"