#!/usr/bin/env bash

echo "🔧 Render Database Connection Fix"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're running on Render
if [ "$RENDER" = "true" ]; then
    print_status "Running on Render platform ✅"
else
    print_warning "Not running on Render - this is a local/dev environment"
fi

# Check DATABASE_URL
print_status "Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not set!"
    echo "💡 On Render:"
    echo "   1. Go to your PostgreSQL service dashboard"
    echo "   2. Copy the Internal Database URL"
    echo "   3. Set it as DATABASE_URL environment variable in your web service"
    exit 1
else
    print_success "DATABASE_URL is set"
    
    # Parse DATABASE_URL safely
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
        
        echo "   Host: $DB_HOST"
        echo "   Port: $DB_PORT"
        echo "   Database: $DB_NAME"
        echo "   User: $DB_USER"
        
        if [[ $DB_HOST == dpg-* ]]; then
            print_success "Render PostgreSQL detected ✅"
        else
            print_warning "Not a Render PostgreSQL URL"
        fi
    else
        print_warning "Could not parse DATABASE_URL format"
    fi
fi

# Test database connection with timeout
print_status "Testing database connection..."
timeout 30 node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
        log: ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });

    console.log('🔄 Attempting to connect...');
    
    prisma.\$connect()
        .then(() => {
            console.log('✅ Database connection successful');
            return prisma.\$queryRaw\`SELECT version(), current_database(), current_user\`;
        })
        .then(result => {
            console.log('📊 Database info:');
            console.log('   PostgreSQL version:', result[0]?.version?.split(' ')[1] || 'Unknown');
            console.log('   Database name:', result[0]?.current_database || 'Unknown');
            console.log('   Connected user:', result[0]?.current_user || 'Unknown');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Connection failed:', error.message);
            console.error('   Error code:', error.code);
            
            if (error.code === 'P1001') {
                console.error('💡 Database server unreachable:');
                console.error('   - Database service may be starting up (wait 2-3 minutes)');
                console.error('   - Check if DATABASE_URL is correct');
                console.error('   - Verify network connectivity');
            } else if (error.code === 'P1000') {
                console.error('💡 Authentication failed:');
                console.error('   - Check username/password in DATABASE_URL');
                console.error('   - Verify database user permissions');
            }
            
            process.exit(1);
        })
        .finally(() => {
            prisma.\$disconnect();
        });
" 2>/dev/null

CONNECTION_STATUS=$?

if [ $CONNECTION_STATUS -eq 0 ]; then
    print_success "Database connection successful!"
else
    print_error "Database connection failed!"
    
    print_status "Attempting database setup..."
    
    # Wait a bit more for database to be ready
    print_status "Waiting for database to be fully ready..."
    sleep 10
    
    # Try to setup database schema
    print_status "Setting up database schema..."
    if npx prisma db push --accept-data-loss; then
        print_success "Database schema setup completed"
    else
        print_error "Failed to setup database schema"
    fi
    
    # Try to generate Prisma client
    print_status "Generating Prisma client..."
    if npx prisma generate; then
        print_success "Prisma client generated successfully"
    else
        print_error "Failed to generate Prisma client"
    fi
    
    # Try to seed database
    print_status "Seeding database with initial data..."
    if npm run seed; then
        print_success "Database seeded successfully"
    else
        print_warning "Database seeding failed (may already exist)"
    fi
    
    # Final connection test
    print_status "Final connection test..."
    if timeout 15 node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$queryRaw\`SELECT 1\`
            .then(() => { console.log('✅ Final test passed'); process.exit(0); })
            .catch(() => { console.log('❌ Final test failed'); process.exit(1); })
            .finally(() => prisma.\$disconnect());
    " 2>/dev/null; then
        print_success "Database is now ready!"
    else
        print_error "Database still not accessible"
        echo ""
        echo "🚨 Manual steps needed:"
        echo "1. Check Render PostgreSQL service status"
        echo "2. Verify DATABASE_URL in environment variables"
        echo "3. Wait 2-3 minutes for database startup"
        echo "4. Restart the web service"
        exit 1
    fi
fi

# Check for required tables
print_status "Checking database tables..."
node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    Promise.all([
        prisma.user.count(),
        prisma.category.count(),
        prisma.item.count(),
        prisma.supplier.count()
    ])
    .then(([users, categories, items, suppliers]) => {
        console.log('📊 Table status:');
        console.log('   Users:', users);
        console.log('   Categories:', categories);
        console.log('   Items:', items);
        console.log('   Suppliers:', suppliers);
        
        if (users === 0) {
            console.log('⚠️ No admin user found - will create one');
        }
    })
    .catch(error => {
        console.log('❌ Tables not accessible:', error.message);
    })
    .finally(() => prisma.\$disconnect());
" 2>/dev/null

# Setup admin user if needed
print_status "Setting up admin user..."
if node setup-admin.js; then
    print_success "Admin user setup completed"
else
    print_warning "Admin user setup failed (may already exist)"
fi

print_success "Database fix process completed!"
echo ""
echo "🎯 Login credentials:"
echo "   Username: owner"
echo "   Password: 1234"
echo ""
echo "🌐 Test the backend at: /api/health"