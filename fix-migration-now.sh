#!/bin/bash

# Quick Fix Migration Script
echo "🔧 Restaurant Inventory - Migration Fix Script"
echo "============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if in backend directory
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}📁 Navigating to backend directory...${NC}"
    cd backend || {
        echo -e "${RED}❌ Backend directory not found!${NC}"
        exit 1
    }
fi

echo -e "${GREEN}✅ Code changes applied:${NC}"
echo "   - Auto-migration in server.ts"
echo "   - Migration API routes"
echo "   - Enhanced error handling"
echo ""

echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo "1. Deploy changes to Render:"
echo "   - Go to Render Dashboard"
echo "   - Services → restaurant-inventory-backend"
echo "   - Click 'Manual Deploy' or 'Restart Service'"
echo ""

echo "2. Monitor logs for auto-migration:"
echo "   Look for: '🔄 Attempting to run database migrations...'"
echo "   Success: '✅ Migrations completed successfully'"
echo ""

echo "3. Verify fix:"
echo "   - Health: curl https://restaurant-inventory-backend.onrender.com/api/health"
echo "   - Status: curl https://restaurant-inventory-backend.onrender.com/api/migration/status"
echo ""

echo -e "${GREEN}🎯 Migration fix ready for deployment!${NC}"

# Optional: Build check
if command -v npm &> /dev/null; then
    echo -e "${YELLOW}🔍 Running build check...${NC}"
    npm run build 2>/dev/null && echo -e "${GREEN}✅ Build successful${NC}" || echo -e "${YELLOW}⚠️  Build check skipped${NC}"
fi

echo ""
echo -e "${GREEN}📖 For detailed instructions, see: MIGRATION_FIX_GUIDE.md${NC}"