#!/bin/bash

# Auto-Migration Management Script
# Sử dụng để bật/tắt và quản lý auto-migration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} Restaurant Inventory - Auto Migration${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_error ".env file not found!"
        echo "Creating .env from env.example..."
        if [ -f env.example ]; then
            cp env.example .env
            print_status ".env file created from env.example"
        else
            touch .env
            print_status "Empty .env file created"
        fi
    fi
}

# Get current auto-migration status
get_migration_status() {
    if grep -q "AUTO_MIGRATION_ENABLED=true" .env 2>/dev/null; then
        echo "enabled"
    else
        echo "disabled"
    fi
}

# Enable auto-migration
enable_migration() {
    print_status "Enabling auto-migration..."
    
    # Remove existing AUTO_MIGRATION_ENABLED line
    sed -i.bak '/^AUTO_MIGRATION_ENABLED=/d' .env 2>/dev/null || true
    
    # Add AUTO_MIGRATION_ENABLED=true
    echo "AUTO_MIGRATION_ENABLED=true" >> .env
    
    print_status "Auto-migration enabled successfully!"
    print_warning "Restart your server to apply changes"
}

# Disable auto-migration
disable_migration() {
    print_status "Disabling auto-migration..."
    
    # Remove existing AUTO_MIGRATION_ENABLED line
    sed -i.bak '/^AUTO_MIGRATION_ENABLED=/d' .env 2>/dev/null || true
    
    # Add AUTO_MIGRATION_ENABLED=false
    echo "AUTO_MIGRATION_ENABLED=false" >> .env
    
    print_status "Auto-migration disabled successfully!"
}

# Check migration status via API
check_api_status() {
    print_status "Checking migration status via API..."
    
    local port=${PORT:-3000}
    local response=$(curl -s "http://localhost:${port}/api/migration/status" 2>/dev/null || echo "error")
    
    if [ "$response" = "error" ]; then
        print_error "Cannot connect to server. Make sure the server is running on port $port"
        return 1
    fi
    
    echo "Migration Status:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Trigger manual migration via API
trigger_migration() {
    print_status "Triggering manual migration..."
    
    local port=${PORT:-3000}
    local response=$(curl -s -X POST "http://localhost:${port}/api/migration/trigger" 2>/dev/null || echo "error")
    
    if [ "$response" = "error" ]; then
        print_error "Cannot connect to server. Make sure the server is running on port $port"
        return 1
    fi
    
    echo "Migration Result:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Test database connection
test_connection() {
    local database_url=$1
    print_status "Testing database connection..."
    
    if [ -z "$database_url" ]; then
        print_error "DATABASE_URL not provided"
        return 1
    fi
    
    # Use node to test connection
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient({ datasources: { db: { url: '$database_url' } } });
        
        prisma.\$queryRaw\`SELECT 1\`.then(() => {
            console.log('✅ Database connection successful');
            process.exit(0);
        }).catch(err => {
            console.error('❌ Database connection failed:', err.message);
            process.exit(1);
        }).finally(() => prisma.\$disconnect());
    "
}

# Backup current database
backup_database() {
    print_status "Creating database backup..."
    
    local database_url=$(grep "DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')
    if [ -z "$database_url" ]; then
        print_error "DATABASE_URL not found in .env"
        return 1
    fi
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="backup_${timestamp}.sql"
    
    if [[ $database_url == postgresql://* ]] || [[ $database_url == postgres://* ]]; then
        pg_dump "$database_url" > "$backup_file"
        print_status "Backup created: $backup_file"
    else
        print_error "Manual backup only supported for PostgreSQL"
        return 1
    fi
}

# Display help
show_help() {
    print_header
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  enable          Enable auto-migration"
    echo "  disable         Disable auto-migration"
    echo "  status          Show current migration status"
    echo "  check           Check migration status via API"
    echo "  trigger         Trigger manual migration via API"
    echo "  test [URL]      Test database connection"
    echo "  backup          Create database backup"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 enable                     # Enable auto-migration"
    echo "  $0 status                     # Show status"
    echo "  $0 test postgresql://...      # Test connection"
    echo "  $0 backup                     # Create backup"
    echo ""
}

# Main script logic
main() {
    print_header
    
    case "${1:-help}" in
        "enable")
            check_env_file
            enable_migration
            ;;
        "disable")
            check_env_file
            disable_migration
            ;;
        "status")
            check_env_file
            current_status=$(get_migration_status)
            echo "Auto-migration status: $current_status"
            
            # Show current DATABASE_URL (masked)
            database_url=$(grep "DATABASE_URL=" .env 2>/dev/null | cut -d '=' -f2- | tr -d '"')
            if [ -n "$database_url" ]; then
                masked_url=$(echo "$database_url" | sed 's/\/\/[^:]*:[^@]*@/\/\/***:***@/')
                echo "Database URL: $masked_url"
            else
                echo "Database URL: not configured"
            fi
            ;;
        "check")
            check_api_status
            ;;
        "trigger")
            trigger_migration
            ;;
        "test")
            test_connection "$2"
            ;;
        "backup")
            backup_database
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 