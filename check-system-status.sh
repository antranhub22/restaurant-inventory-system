#!/bin/bash

echo "🔍 Checking Restaurant Inventory System Status..."
echo "================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local url=$3
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not running on port $port${NC}"
        return 1
    fi
}

# Function to check database connection
check_database() {
    echo -e "\n${YELLOW}📊 Checking Database Connection...${NC}"
    
    if [ -f "backend/.env" ]; then
        echo -e "${GREEN}✅ .env file exists${NC}"
        
        # Try to check database connection
        cd backend
        if npx prisma db pull > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Database connection successful${NC}"
        else
            echo -e "${RED}❌ Database connection failed${NC}"
        fi
        cd ..
    else
        echo -e "${RED}❌ .env file not found in backend directory${NC}"
    fi
}

# Function to check dependencies
check_dependencies() {
    echo -e "\n${YELLOW}📦 Checking Dependencies...${NC}"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
    else
        echo -e "${RED}❌ Node.js not installed${NC}"
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        echo -e "${GREEN}✅ npm $(npm --version)${NC}"
    else
        echo -e "${RED}❌ npm not installed${NC}"
    fi
    
    # Check if node_modules exist
    if [ -d "backend/node_modules" ]; then
        echo -e "${GREEN}✅ Backend dependencies installed${NC}"
    else
        echo -e "${RED}❌ Backend dependencies not installed${NC}"
    fi
    
    if [ -d "frontend/node_modules" ]; then
        echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    else
        echo -e "${RED}❌ Frontend dependencies not installed${NC}"
    fi
}

# Function to check environment files
check_env_files() {
    echo -e "\n${YELLOW}⚙️ Checking Environment Files...${NC}"
    
    if [ -f "backend/.env" ]; then
        echo -e "${GREEN}✅ Backend .env exists${NC}"
    else
        echo -e "${RED}❌ Backend .env missing${NC}"
    fi
    
    if [ -f "frontend/.env" ]; then
        echo -e "${GREEN}✅ Frontend .env exists${NC}"
    else
        echo -e "${YELLOW}⚠️ Frontend .env missing (optional)${NC}"
    fi
}

# Function to check processes
check_processes() {
    echo -e "\n${YELLOW}🔄 Checking Running Processes...${NC}"
    
    # Check backend process
    if pgrep -f "ts-node-dev.*server.ts" > /dev/null; then
        echo -e "${GREEN}✅ Backend development server is running${NC}"
    else
        echo -e "${RED}❌ Backend development server is not running${NC}"
    fi
    
    # Check frontend process
    if pgrep -f "vite" > /dev/null; then
        echo -e "${GREEN}✅ Frontend development server is running${NC}"
    else
        echo -e "${RED}❌ Frontend development server is not running${NC}"
    fi
}

# Function to check services
check_services() {
    echo -e "\n${YELLOW}🌐 Checking Services...${NC}"
    
    check_service "Backend API" "3000" "http://localhost:3000/api/health"
    check_service "Frontend App" "5173" "http://localhost:5173"
}

# Function to provide recommendations
provide_recommendations() {
    echo -e "\n${YELLOW}💡 Recommendations:${NC}"
    
    if ! pgrep -f "ts-node-dev.*server.ts" > /dev/null; then
        echo -e "  • Start backend: ${GREEN}cd backend && npm run dev${NC}"
    fi
    
    if ! pgrep -f "vite" > /dev/null; then
        echo -e "  • Start frontend: ${GREEN}cd frontend && npm run dev${NC}"
    fi
    
    if [ ! -f "backend/.env" ]; then
        echo -e "  • Create backend .env: ${GREEN}cd backend && cp .env.example .env${NC}"
    fi
    
    if [ ! -d "backend/node_modules" ]; then
        echo -e "  • Install backend dependencies: ${GREEN}cd backend && npm install${NC}"
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        echo -e "  • Install frontend dependencies: ${GREEN}cd frontend && npm install${NC}"
    fi
}

# Main execution
main() {
    check_dependencies
    check_env_files
    check_database
    check_processes
    check_services
    provide_recommendations
    
    echo -e "\n${GREEN}🎉 System status check completed!${NC}"
}

# Run main function
main 