#!/usr/bin/env bash
set -e  # Exit on any error

echo "🚀 Starting Restaurant Inventory Backend on Render..."
echo "============================================="

# Environment check
echo "📊 Environment Information:"
echo "   Node version: $(node --version)"
echo "   NPM version: $(npm --version)"
echo "   Environment: ${NODE_ENV:-development}"
echo "   Port: ${PORT:-4000}"
echo "   Frontend URL: ${FRONTEND_URL:-not-set}"
echo "   Working Directory: $(pwd)"

# File system check and build verification
echo ""
echo "🗂️ File System & Build Check:"
echo "   Current directory contents:"
ls -la

echo ""
echo "   Checking build output:"
if [ -f "dist/server.js" ]; then
    echo "   ✅ dist/server.js exists"
    ENTRY_POINT="dist/server.js"
    echo "   📦 Build verification: $(ls -lh dist/server.js)"
elif [ -f "dist/app.js" ]; then
    echo "   ✅ dist/app.js exists"
    ENTRY_POINT="dist/app.js"
    echo "   📦 Build verification: $(ls -lh dist/app.js)"
else
    echo "   ❌ No compiled JavaScript files found!"
    echo "   📂 Contents of dist/ directory:"
    ls -la dist/ 2>/dev/null || echo "   ❌ dist/ directory doesn't exist!"
    
    echo ""
    echo "   🔧 Attempting to rebuild..."
    if npm run build; then
        echo "   ✅ Rebuild successful"
        if [ -f "dist/server.js" ]; then
            ENTRY_POINT="dist/server.js"
        elif [ -f "dist/app.js" ]; then
            ENTRY_POINT="dist/app.js"
        else
            echo "   ❌ Rebuild failed to create expected files"
            echo "   📂 Post-build dist/ contents:"
            ls -la dist/ 2>/dev/null || echo "   ❌ Still no dist/ directory"
            
            echo "   🆘 Falling back to TypeScript execution"
            if [ -f "src/server.ts" ]; then
                ENTRY_POINT="src/server.ts"
                FALLBACK_MODE=true
            else
                echo "   ❌ No fallback options available!"
                echo "   Available TypeScript files:"
                find src/ -name "*.ts" | head -5 2>/dev/null || echo "   ❌ No TypeScript files found"
                exit 1
            fi
        fi
    else
        echo "   ❌ Rebuild failed!"
        exit 1
    fi
fi

# Database environment check
echo ""
echo "🗄️ Database Configuration:"
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set!"
    echo "💡 Please set DATABASE_URL in Render environment variables"
    echo "   Format: postgresql://user:pass@host:port/database"
    exit 1
else
    echo "✅ DATABASE_URL is configured"
    
    # Parse and display database info (safely)
    if [[ $DATABASE_URL == postgresql://* ]]; then
        # Extract hostname safely
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's#.*@\([^:]*\):.*#\1#p')
        if [[ $DB_HOST == dpg-*render* ]]; then
            echo "   Provider: ✅ Render PostgreSQL"
        elif [[ $DB_HOST == *neon.tech* ]]; then
            echo "   Provider: Neon.tech"  
        else
            echo "   Provider: Custom PostgreSQL"
        fi
        echo "   Host: $DB_HOST"
    fi
fi

# Database connection test
echo ""
echo "🔧 Database Connection Test:"
if timeout 30 node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => { 
    console.log('✅ Database connection successful'); 
    return prisma.\$disconnect();
  })
  .then(() => process.exit(0))
  .catch((e) => { 
    console.log('❌ Database connection failed:', e.message); 
    process.exit(1); 
  });
" 2>/dev/null; then
    echo "✅ Database connection verified"
else
    echo "⚠️ Database connection test failed (server will retry on startup)"
fi

# Database migrations and setup
echo ""
echo "🗄️ Database Setup and Migrations:"
echo "   Checking database status and running migrations..."
if node check-and-migrate.js; then
    echo "✅ Database setup completed successfully"
else
    echo "❌ Database setup failed!"
    echo "⚠️ Server will continue but may have database issues"
fi

# Prisma client generation
echo ""
echo "🔧 Generating Prisma Client:"
if npx prisma generate; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ Prisma client generation failed!"
    echo "⚠️ This may cause runtime errors"
fi

# Admin user setup
echo ""
echo "👨‍💼 Setting Up Admin User:"
if [ "$FALLBACK_MODE" = true ]; then
    # Use tsx for TypeScript execution
    if npx tsx src/scripts/setup-admin-production.ts; then
        echo "✅ Admin user setup completed"
    else
        echo "⚠️ Admin setup failed or admin already exists"
    fi
else
    # Try to run compiled version, fallback to TypeScript
    if [ -f "dist/scripts/setup-admin-production.js" ]; then
        if node dist/scripts/setup-admin-production.js; then
            echo "✅ Admin user setup completed"
        else
            echo "⚠️ Admin setup failed or admin already exists"
        fi
    else
        echo "   Fallback to TypeScript execution..."
        if npx tsx src/scripts/setup-admin-production.ts; then
            echo "✅ Admin user setup completed"
        else
            echo "⚠️ Admin setup failed or admin already exists"
        fi
    fi
fi

# Pre-flight checks
echo ""
echo "🔍 Pre-flight Checks:"
echo "   - Node.js: ✅ Ready"
echo "   - Environment: ✅ $(echo ${NODE_ENV:-development})"
echo "   - Port: ✅ ${PORT:-4000}"
echo "   - Entry Point: ✅ $ENTRY_POINT"

if [ "$FALLBACK_MODE" = true ]; then
    echo "   - Mode: ⚠️ TypeScript Fallback (tsx)"
    # Ensure tsx is available
    if ! command -v tsx &> /dev/null; then
        echo "   Installing tsx for TypeScript execution..."
        npm install -g tsx
    fi
else
    echo "   - Mode: ✅ Production (compiled)"
fi

# Final startup
echo ""
echo "🌐 Starting server..."
echo "============================================="

# Export PORT to ensure it's available to the application
export PORT=${PORT:-4000}

# Start server with appropriate method
if [ "$FALLBACK_MODE" = true ]; then
    echo "🔄 Starting with tsx (TypeScript mode)..."
    exec npx tsx $ENTRY_POINT
else
    echo "🚀 Starting with node (production mode)..."
    exec node $ENTRY_POINT
fi 