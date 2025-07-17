#!/usr/bin/env bash

echo "🚀 Starting Restaurant Inventory Backend on Render..."
echo "============================================="

# Environment check
echo "📊 Environment Information:"
echo "   Node version: $(node --version)"
echo "   Environment: ${NODE_ENV:-development}"
echo "   Port: ${PORT:-4000}"
echo "   Frontend URL: ${FRONTEND_URL:-not-set}"
echo "   Working Directory: $(pwd)"

# File system check
echo ""
echo "🗂️ File System Check:"
echo "   Current directory contents:"
ls -la
echo ""
echo "   Dist directory check:"
if [ -d "dist" ]; then
    echo "   ✅ dist/ directory exists"
    echo "   Contents of dist/:"
    ls -la dist/
else
    echo "   ❌ dist/ directory missing!"
    echo "   Running build now..."
    npm run build
    if [ -d "dist" ]; then
        echo "   ✅ Build successful, dist/ created"
        ls -la dist/
    else
        echo "   ❌ Build failed, cannot create dist/"
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
    fi
fi

# Database setup and verification
echo ""
echo "🔧 Database Setup & Verification:"

# Function to test database connection
test_database() {
    echo "🔍 Testing database connection..."
    if timeout 15 node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function test() {
            try {
                await prisma.\$connect();
                console.log('✅ Database connection successful');
                
                // Test query
                const result = await prisma.\$queryRaw\`SELECT version()\`;
                console.log('✅ Database query successful');
                
                await prisma.\$disconnect();
                process.exit(0);
            } catch (error) {
                console.error('❌ Database connection failed:', error.message);
                process.exit(1);
            }
        }
        
        test();
    "; then
        return 0
    else
        return 1
    fi
}

# Try database connection with retries
echo "⏳ Attempting database connection (max 3 attempts)..."
for attempt in {1..3}; do
    echo "🔄 Connection attempt $attempt/3..."
    
    if test_database; then
        echo "✅ Database connection established!"
        break
    else
        if [ $attempt -lt 3 ]; then
            echo "⏳ Connection failed, waiting 10 seconds before retry..."
            sleep 10
        else
            echo "❌ All database connection attempts failed!"
            echo ""
            echo "🚨 TROUBLESHOOTING GUIDE:"
            echo "1. Check DATABASE_URL in Render environment variables"
            echo "2. Ensure database service is running and healthy"
            echo "3. Verify backend and database are in same region"
            echo "4. Check Render PostgreSQL service logs"
            echo "5. Try using Internal Database URL (not External)"
            echo ""
            echo "💡 Server will start but may be unhealthy until database connects"
        fi
    fi
done

# Schema setup (non-blocking)
echo ""
echo "📋 Database Schema Setup:"
if npx prisma db push --accept-data-loss 2>/dev/null; then
    echo "✅ Database schema is up to date"
    
    # Try to seed if no data exists
    echo "🌱 Checking if database needs seeding..."
    if timeout 10 node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function checkAndSeed() {
            try {
                const userCount = await prisma.user.count();
                if (userCount === 0) {
                    console.log('📥 Database is empty, running seed...');
                    process.exit(2); // Special exit code for seeding
                } else {
                    console.log(\`✅ Database has \${userCount} users, no seeding needed\`);
                    process.exit(0);
                }
            } catch (error) {
                console.log('⚠️ Cannot check database, skipping seed');
                process.exit(1);
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        checkAndSeed();
    "; then
        echo "✅ Database already has data"
    elif [ $? -eq 2 ]; then
        echo "🌱 Seeding database..."
        if npm run db:seed 2>/dev/null || npx prisma db seed 2>/dev/null; then
            echo "✅ Database seeded successfully"
        else
            echo "⚠️ Database seeding failed (not critical)"
        fi
    fi
else
    echo "⚠️ Schema setup failed (will be retried by server)"
fi

# Final pre-flight check
echo ""
echo "🔍 Pre-flight Checks:"
echo "   - Node.js: ✅ Ready"
echo "   - Environment: ✅ $(echo ${NODE_ENV:-development})"
echo "   - Port: ✅ ${PORT:-4000}"

# Check for entry point files
if [ -f "dist/server.js" ]; then
    echo "   - App bundle: ✅ dist/server.js found"
    ENTRY_POINT="dist/server.js"
elif [ -f "dist/app.js" ]; then
    echo "   - App bundle: ✅ dist/app.js found"
    ENTRY_POINT="dist/app.js"
elif [ -f "src/server.ts" ]; then
    echo "   - App bundle: ⚠️ Only TypeScript source found, using tsx"
    ENTRY_POINT="src/server.ts"
    # Install tsx if needed
    if ! command -v tsx &> /dev/null; then
        echo "   Installing tsx for TypeScript execution..."
        npm install -g tsx
    fi
else
    echo "   - App bundle: ❌ No entry point found!"
    echo "   Available files:"
    find . -name "*.js" -o -name "*.ts" | head -10
    exit 1
fi

# Start the server
echo ""
echo "🌐 Starting server with entry point: $ENTRY_POINT"
echo "============================================="

# Start with appropriate command
if [[ $ENTRY_POINT == *.ts ]]; then
    exec npx tsx $ENTRY_POINT
else
    exec node $ENTRY_POINT
fi 