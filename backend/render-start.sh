#!/usr/bin/env bash

echo "🚀 Starting Restaurant Inventory Backend on Render..."
echo "============================================="

# Environment check
echo "📊 Environment Information:"
echo "   Node version: $(node --version)"
echo "   Environment: ${NODE_ENV:-development}"
echo "   Port: ${PORT:-4000}"
echo "   Frontend URL: ${FRONTEND_URL:-not-set}"

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
echo "   - App bundle: $([ -f "dist/server.js" ] && echo "✅ Found" || echo "❌ Missing")"

# Start the server
echo ""
echo "🌐 Starting server..."
echo "============================================="

# Use the server entry point
if [ -f "dist/server.js" ]; then
    exec node dist/server.js
elif [ -f "dist/app.js" ]; then
    exec node dist/app.js
else
    echo "❌ Cannot find built application!"
    echo "Expected: dist/server.js or dist/app.js"
    exit 1
fi 