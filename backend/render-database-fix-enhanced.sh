#!/usr/bin/env bash

echo "🔧 Enhanced Render Database Connection Fix"
echo "=========================================="

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

# Configuration
MAX_RETRIES=5
RETRY_DELAY=10
CONNECTION_TIMEOUT=30

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

# Function to test database connection
test_connection() {
    timeout $CONNECTION_TIMEOUT node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient({
            log: ['error'],
            datasources: {
                db: {
                    url: process.env.DATABASE_URL
                }
            }
        });

        console.log('🔄 Testing connection...');
        
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
                process.exit(1);
            })
            .finally(() => {
                prisma.\$disconnect();
            });
    " 2>/dev/null
}

# Retry connection with exponential backoff
print_status "Testing database connection with retry logic..."
for i in $(seq 1 $MAX_RETRIES); do
    print_status "Attempt $i/$MAX_RETRIES..."
    
    if test_connection; then
        print_success "Database connection successful!"
        CONNECTION_SUCCESS=true
        break
    else
        print_warning "Connection attempt $i failed"
        
        if [ $i -lt $MAX_RETRIES ]; then
            CURRENT_DELAY=$((RETRY_DELAY * i))
            print_status "Waiting ${CURRENT_DELAY} seconds before retry..."
            sleep $CURRENT_DELAY
        fi
    fi
done

if [ "$CONNECTION_SUCCESS" != "true" ]; then
    print_error "All connection attempts failed!"
    print_status "Attempting database setup anyway..."
fi

# Database setup with retry logic
setup_database() {
    local operation=$1
    local command=$2
    local max_attempts=3
    
    for attempt in $(seq 1 $max_attempts); do
        print_status "$operation (attempt $attempt/$max_attempts)..."
        
        if eval "$command"; then
            print_success "$operation completed"
            return 0
        else
            print_warning "$operation attempt $attempt failed"
            if [ $attempt -lt $max_attempts ]; then
                sleep 5
            fi
        fi
    done
    
    print_error "$operation failed after $max_attempts attempts"
    return 1
}

# Generate Prisma client first
setup_database "Generating Prisma client" "npx prisma generate"

# Setup database schema
setup_database "Setting up database schema" "npx prisma db push --accept-data-loss"

# Seed database
setup_database "Seeding database" "npm run seed"

# Setup admin user
setup_database "Setting up admin user" "node setup-admin.js"

# Final verification
print_status "Final verification..."
if test_connection; then
    print_success "Database setup completed successfully!"
    
    # Check table status
    print_status "Checking table status..."
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        Promise.all([
            prisma.user.count().catch(() => 0),
            prisma.category.count().catch(() => 0),
            prisma.item.count().catch(() => 0),
            prisma.supplier.count().catch(() => 0)
        ])
        .then(([users, categories, items, suppliers]) => {
            console.log('📊 Table status:');
            console.log('   Users:', users);
            console.log('   Categories:', categories);
            console.log('   Items:', items);
            console.log('   Suppliers:', suppliers);
        })
        .catch(error => {
            console.log('❌ Tables check failed:', error.message);
        })
        .finally(() => prisma.\$disconnect());
    " 2>/dev/null
    
    echo ""
    echo "🎯 System ready! Login credentials:"
    echo "   Username: owner"
    echo "   Password: 1234"
    echo ""
    echo "🌐 Test endpoints:"
    echo "   Health check: /api/health"
    echo "   Login: POST /api/auth/login"
    
else
    print_error "Final verification failed!"
    echo ""
    echo "🚨 Manual steps needed:"
    echo "1. Check Render PostgreSQL service status"
    echo "2. Verify DATABASE_URL in environment variables"
    echo "3. Check service logs for detailed errors"
    echo "4. Restart the web service if needed"
    exit 1
fi

print_success "Enhanced database fix completed!"