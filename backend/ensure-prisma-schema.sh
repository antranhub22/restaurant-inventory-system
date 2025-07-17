#!/usr/bin/env bash
# Script to ensure Prisma schema is found and properly configured
set -e

echo "🔍 Ensuring Prisma schema is available..."

# Function to find schema.prisma
find_schema() {
    local paths=(
        "./prisma/schema.prisma"
        "./backend/prisma/schema.prisma"
        "../prisma/schema.prisma"
        "./dist/prisma/schema.prisma"
        "../backend/prisma/schema.prisma"
        "/app/prisma/schema.prisma"
        "/app/backend/prisma/schema.prisma"
    )
    
    for path in "${paths[@]}"; do
        if [ -f "$path" ]; then
            echo "$path"
            return 0
        fi
    done
    
    return 1
}

# Find schema
SCHEMA_PATH=$(find_schema)

if [ -z "$SCHEMA_PATH" ]; then
    echo "❌ Could not find schema.prisma in any expected location!"
    echo "📂 Current working directory: $(pwd)"
    echo "📂 Directory contents:"
    ls -la
    
    # Try to find it with find command
    echo "🔍 Searching entire directory tree..."
    find . -name "schema.prisma" -type f 2>/dev/null || true
    
    exit 1
fi

echo "✅ Found schema at: $SCHEMA_PATH"

# Determine the best working directory
SCHEMA_DIR=$(dirname "$SCHEMA_PATH")
BACKEND_DIR=$(dirname "$SCHEMA_DIR")

# If we found schema in a dist directory, use the parent backend directory
if [[ "$SCHEMA_PATH" == *"/dist/"* ]]; then
    BACKEND_DIR="${BACKEND_DIR%/dist}"
fi

echo "📂 Backend directory: $BACKEND_DIR"

# Ensure we have a local prisma directory with schema
if [ ! -f "./prisma/schema.prisma" ]; then
    echo "⚠️ Creating local prisma directory..."
    mkdir -p ./prisma
    cp "$SCHEMA_PATH" ./prisma/schema.prisma
    
    # Also copy migrations if they exist
    if [ -d "$SCHEMA_DIR/migrations" ]; then
        cp -r "$SCHEMA_DIR/migrations" ./prisma/
    fi
    
    echo "✅ Created local prisma directory"
fi

# Export for use in other scripts
export PRISMA_SCHEMA_PATH="./prisma/schema.prisma"
export PRISMA_BACKEND_DIR="$BACKEND_DIR"

echo "✅ Prisma schema setup completed"
echo "   PRISMA_SCHEMA_PATH: $PRISMA_SCHEMA_PATH"
echo "   Working directory: $(pwd)"