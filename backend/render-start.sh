#!/usr/bin/env bash
# Enhanced Render startup script with comprehensive database setup
set -e

echo "🚀 Starting Restaurant Inventory System on Render..."
echo "=================================================="

# Environment check
echo "📊 Environment Information:"
echo "   Node version: $(node --version)"
echo "   NPM version: $(npm --version)"  
echo "   Working Directory: $(pwd)"
echo "   Process ID: $$"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in current directory"
    echo "📂 Current directory contents:"
    ls -la
    exit 1
fi

# Ensure Prisma schema is available
echo ""
echo "🔍 Setting up Prisma schema..."

# Make the ensure script executable if it exists
if [ -f "./ensure-prisma-schema.sh" ]; then
    chmod +x ./ensure-prisma-schema.sh
    source ./ensure-prisma-schema.sh
elif [ -f "./backend/ensure-prisma-schema.sh" ]; then
    chmod +x ./backend/ensure-prisma-schema.sh
    source ./backend/ensure-prisma-schema.sh
else
    echo "⚠️ ensure-prisma-schema.sh not found, using fallback..."
    
    # Fallback: More comprehensive search for schema.prisma
    SCHEMA_PATH=""
    POSSIBLE_PATHS=(
        "./prisma/schema.prisma"
        "./backend/prisma/schema.prisma"  
        "../prisma/schema.prisma"
        "./dist/prisma/schema.prisma"
        "../backend/prisma/schema.prisma"
    )
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [ -f "$path" ]; then
            echo "✅ Found schema.prisma at: $path"
            SCHEMA_PATH="$path"
            break
        fi
    done
    
    if [ -z "$SCHEMA_PATH" ]; then
        echo "❌ Prisma schema not found!"
        echo "📂 Searching for schema files..."
        find . -name "schema.prisma" -type f 2>/dev/null || echo "   No schema.prisma files found"
        echo "📂 Current directory structure:"
        ls -la
        if [ -d "prisma" ]; then
            echo "📂 Prisma directory contents:"
            ls -la prisma/
        fi
        exit 1
    fi
    
    # Ensure we're in the correct directory for Prisma operations
    WORKING_DIR=$(dirname "$SCHEMA_PATH")
    WORKING_DIR=$(dirname "$WORKING_DIR")  # Go up one level from prisma dir
    echo "📂 Setting working directory to: $WORKING_DIR"
    cd "$WORKING_DIR"
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate --schema="./prisma/schema.prisma"

# Database setup
echo ""
echo "🗄️ Setting up database..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set!"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Parse database provider
if [[ $DATABASE_URL == *"postgresql"* ]]; then
    echo "🎯 PostgreSQL database detected"
elif [[ $DATABASE_URL == *"mysql"* ]]; then
    echo "🎯 MySQL database detected"
else
    echo "🎯 Database type: $(echo $DATABASE_URL | cut -d: -f1)"
fi

# Wait for database to be ready
echo ""
echo "⏳ Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$connect()
          .then(() => { 
            console.log('✅ Database connection successful'); 
            return prisma.\$disconnect();
          })
          .then(() => process.exit(0))
          .catch((e) => { 
            console.log('⚠️ Database not ready:', e.message);
            process.exit(1);
          });
    " 2>/dev/null; then
        echo "✅ Database is ready!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "   Attempt $RETRY_COUNT/$MAX_RETRIES - retrying in 5 seconds..."
        sleep 5
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Database connection failed after $MAX_RETRIES attempts"
    exit 1
fi

# Check if database has tables
echo ""
echo "🔍 Checking database schema..."
TABLE_CHECK=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    await prisma.\$connect();
    
    // Try to query User table
    const userCount = await prisma.user.count();
    console.log('TABLES_EXIST');
    return true;
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log('TABLES_MISSING');
      return false;
    }
    throw error;
  } finally {
    await prisma.\$disconnect();
  }
}

checkTables().catch(e => {
  console.log('ERROR:', e.message);
  process.exit(1);
});
" 2>/dev/null || echo "ERROR")

if [[ $TABLE_CHECK == *"TABLES_EXIST"* ]]; then
    echo "✅ Database tables already exist"
elif [[ $TABLE_CHECK == *"TABLES_MISSING"* ]]; then
    echo "⚠️ Database tables missing - running migrations..."
    
    # Make sure we generate client first with correct schema path
    echo "🔧 Regenerating Prisma client with correct schema path..."
    if npx prisma generate --schema="./prisma/schema.prisma"; then
        echo "✅ Prisma client regenerated"
    else
        echo "❌ Failed to generate Prisma client"
        exit 1
    fi
    
    # Try migration deploy first
    echo "🔄 Running prisma migrate deploy..."
    if npx prisma migrate deploy --schema="./prisma/schema.prisma" 2>&1; then
        echo "✅ Migrations deployed successfully"
    else
        echo "⚠️ Migration deploy failed, trying db push..."
        if npx prisma db push --schema="./prisma/schema.prisma" --accept-data-loss; then
            echo "✅ Schema pushed successfully"
        else
            echo "❌ Both migration and push failed"
            exit 1
        fi
    fi
    
    # Verify tables were created
    echo "🔍 Verifying table creation..."
    if node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.user.count()
          .then(() => { 
            console.log('✅ Tables verified'); 
            return prisma.\$disconnect();
          })
          .catch(e => {
            console.log('❌ Table verification failed:', e.message);
            process.exit(1);
          });
    "; then
        echo "✅ Database setup completed successfully"
    else
        echo "❌ Database verification failed"
        exit 1
    fi
else
    echo "❌ Database check failed: $TABLE_CHECK"
    exit 1
fi

# Check for admin user and seed if needed
echo ""
echo "👤 Checking admin user..."
ADMIN_CHECK=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    await prisma.\$connect();
    const adminUser = await prisma.user.findFirst({
      where: { role: 'owner' }
    });
    
    if (adminUser) {
      console.log('ADMIN_EXISTS');
    } else {
      console.log('ADMIN_MISSING');
    }
  } catch (error) {
    console.log('ERROR:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

checkAdmin();
" 2>/dev/null || echo "ERROR")

if [[ $ADMIN_CHECK == *"ADMIN_MISSING"* ]]; then
    echo "⚠️ Admin user missing - creating..."
    if node setup-admin.js; then
        echo "✅ Admin user created"
    else
        echo "⚠️ Admin setup failed (will continue)"
    fi
elif [[ $ADMIN_CHECK == *"ADMIN_EXISTS"* ]]; then
    echo "✅ Admin user already exists"
fi

# Start the server
echo ""
echo "🚀 Starting the server..."

# Check which entry point to use
if [ -f "dist/server.js" ]; then
    echo "✅ Using compiled dist/server.js"
    exec node dist/server.js
elif [ -f "dist/app.js" ]; then
    echo "✅ Using compiled dist/app.js"
    exec node dist/app.js
elif [ -f "src/server.ts" ]; then
    echo "⚠️ Using TypeScript source with tsx"
    exec npx tsx src/server.ts
else
    echo "❌ No valid entry point found!"
    echo "📂 Available files:"
    ls -la
    exit 1
fi 