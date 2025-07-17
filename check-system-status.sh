#!/bin/bash

echo "🔍 RESTAURANT INVENTORY SYSTEM STATUS CHECK"
echo "=============================================="
echo "Timestamp: $(date)"
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    echo "Please run this script from the restaurant-inventory-system root directory"
    exit 1
fi

# 1. Check Frontend Status
echo "📱 FRONTEND STATUS"
echo "=================="

# Check if frontend build exists
if [ -d "frontend/dist" ]; then
    print_status 0 "Frontend build exists"
else
    print_status 1 "Frontend build missing - need to run build"
fi

# Check frontend dependencies
if [ -f "frontend/package.json" ]; then
    print_status 0 "Frontend package.json exists"
    cd frontend
    if [ -d "node_modules" ]; then
        print_status 0 "Frontend dependencies installed"
    else
        print_status 1 "Frontend dependencies missing - run npm install"
    fi
    cd ..
else
    print_status 1 "Frontend package.json missing"
fi

echo

# 2. Check Backend Status  
echo "🖥️  BACKEND STATUS"
echo "=================="

# Check backend dependencies
if [ -f "backend/package.json" ]; then
    print_status 0 "Backend package.json exists"
    cd backend
    if [ -d "node_modules" ]; then
        print_status 0 "Backend dependencies installed"
    else
        print_status 1 "Backend dependencies missing - run npm install"
    fi
    
    # Check TypeScript compilation
    if npm run build > /dev/null 2>&1; then
        print_status 0 "TypeScript compilation successful"
    else
        print_status 1 "TypeScript compilation failed"
    fi
    
    cd ..
else
    print_status 1 "Backend package.json missing"
fi

echo

# 3. Check Database Configuration
echo "🗄️  DATABASE STATUS"
echo "==================="

cd backend

# Check if DATABASE_URL is configured
if [ -f ".env" ]; then
    if grep -q "DATABASE_URL" .env; then
        print_status 0 "DATABASE_URL configured in .env"
        
        # Check if it's PostgreSQL
        if grep "DATABASE_URL" .env | grep -q "postgresql://"; then
            print_status 0 "Using PostgreSQL (recommended)"
        else
            print_warning "Database URL format may be incorrect"
        fi
    else
        print_status 1 "DATABASE_URL not found in .env"
    fi
else
    print_warning ".env file not found - using environment variables"
fi

# Test database connection
echo "Testing database connection..."
if node debug-database.js > /dev/null 2>&1; then
    print_status 0 "Database connection successful"
else
    print_status 1 "Database connection failed"
    echo "Run 'node backend/debug-database.js' for detailed info"
fi

# Check Prisma schema
if [ -f "prisma/schema.prisma" ]; then
    print_status 0 "Prisma schema exists"
    
    # Check if migrations exist
    if [ -d "prisma/migrations" ]; then
        migration_count=$(find prisma/migrations -name "*.sql" | wc -l)
        if [ $migration_count -gt 0 ]; then
            print_status 0 "Database migrations exist ($migration_count files)"
        else
            print_status 1 "No migration files found"
        fi
    else
        print_status 1 "Migrations directory missing"
    fi
else
    print_status 1 "Prisma schema missing"
fi

cd ..

echo

# 4. Check Docker Configuration
echo "🐳 DOCKER STATUS"
echo "================"

# Check if Docker files exist
if [ -f "docker-compose.yml" ]; then
    print_status 0 "docker-compose.yml exists"
else
    print_status 1 "docker-compose.yml missing"
fi

if [ -f "backend/Dockerfile" ]; then
    print_status 0 "Backend Dockerfile exists"
else
    print_status 1 "Backend Dockerfile missing"
fi

# Check if Docker is running
if docker --version > /dev/null 2>&1; then
    print_status 0 "Docker is available"
    
    if docker compose ps > /dev/null 2>&1; then
        print_status 0 "Docker Compose is available"
    else
        print_warning "Docker Compose not available or not running"
    fi
else
    print_warning "Docker not available (OK for Render deployment)"
fi

echo

# 5. Check Render Configuration
echo "🌐 RENDER DEPLOYMENT STATUS"
echo "==========================="

if [ -f "render.yaml" ]; then
    print_status 0 "render.yaml exists"
    
    # Check if PostgreSQL service is configured
    if grep -q "type: pserv" render.yaml; then
        print_status 0 "PostgreSQL service configured in render.yaml"
    else
        print_status 1 "PostgreSQL service not found in render.yaml"
    fi
    
    # Check if backend service is configured
    if grep -q "restaurant-inventory-backend" render.yaml; then
        print_status 0 "Backend service configured"
    else
        print_status 1 "Backend service not configured"
    fi
    
    # Check if frontend service is configured  
    if grep -q "restaurant-inventory-frontend" render.yaml; then
        print_status 0 "Frontend service configured"
    else
        print_status 1 "Frontend service not configured"
    fi
else
    print_status 1 "render.yaml missing"
fi

echo

# 6. Environment Check
echo "🔧 ENVIRONMENT REQUIREMENTS"
echo "==========================="

# Check Node.js version
if command -v node > /dev/null 2>&1; then
    node_version=$(node --version)
    print_status 0 "Node.js installed ($node_version)"
    
    # Check if Node version is 18+
    if [[ $node_version == v18* ]] || [[ $node_version == v20* ]] || [[ $node_version == v21* ]]; then
        print_status 0 "Node.js version compatible"
    else
        print_warning "Node.js version may be too old (need 18+)"
    fi
else
    print_status 1 "Node.js not installed"
fi

# Check npm
if command -v npm > /dev/null 2>&1; then
    npm_version=$(npm --version)
    print_status 0 "npm installed ($npm_version)"
else
    print_status 1 "npm not installed"
fi

echo

# 7. Quick Recommendations
echo "💡 RECOMMENDATIONS"
echo "=================="

# Check what needs to be done
issues_found=0

if [ ! -d "frontend/node_modules" ]; then
    echo "1. Install frontend dependencies: cd frontend && npm install"
    issues_found=$((issues_found + 1))
fi

if [ ! -d "backend/node_modules" ]; then
    echo "2. Install backend dependencies: cd backend && npm install"
    issues_found=$((issues_found + 1))
fi

if [ ! -f "backend/.env" ]; then
    echo "3. Create backend/.env file (copy from backend/env.example)"
    issues_found=$((issues_found + 1))
fi

if [ ! -d "frontend/dist" ]; then
    echo "4. Build frontend: cd frontend && npm run build"
    issues_found=$((issues_found + 1))
fi

# Database specific recommendations
echo "5. For PostgreSQL setup:"
echo "   - Local: Use Docker with 'docker compose up -d'"  
echo "   - Render: PostgreSQL service auto-configured in render.yaml"
echo "   - Test connection: cd backend && node debug-database.js"

if [ $issues_found -eq 0 ]; then
    echo -e "${GREEN}✅ No critical issues found!${NC}"
else
    echo -e "${YELLOW}⚠️  Found $issues_found issue(s) to fix${NC}"
fi

echo
echo "🚀 To deploy to Render:"
echo "   git add . && git commit -m 'Deploy' && git push"
echo
echo "Status check completed at $(date)" 