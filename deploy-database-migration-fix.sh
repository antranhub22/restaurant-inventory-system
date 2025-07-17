#!/bin/bash

echo "🚀 DEPLOY DATABASE MIGRATION FIX"
echo "================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/render-start.sh" ]; then
    echo "❌ Error: Must run from restaurant-inventory-system root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected files: backend/render-start.sh"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo "✅ Found backend/render-start.sh"
echo ""

# Check git status
echo "📊 Git Status:"
echo "   Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo "   Status:"
git status --porcelain | head -5

echo ""
echo "🔧 Changes Applied:"
echo "   ✅ Updated backend/render-start.sh (added migrations)"
echo "   ✅ Created backend/src/scripts/setup-admin-production.ts"
echo "   ✅ Created DATABASE_MIGRATION_FIX_SUMMARY.md"
echo ""

# Ask for confirmation
read -p "🤔 Ready to commit and deploy? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled by user"
    exit 0
fi

echo ""
echo "📝 Committing changes..."

# Add all changes
git add backend/render-start.sh
git add backend/src/scripts/setup-admin-production.ts
git add DATABASE_MIGRATION_FIX_SUMMARY.md

# Commit
git commit -m "fix: add database migrations and admin setup to production startup

- Add prisma migrate deploy to render-start.sh
- Add prisma generate to ensure client is updated  
- Create automatic admin user setup script
- Add comprehensive error handling for production

Fixes: User table not found, database connection failures
Admin credentials: admin/Admin123! (change after first login)"

if [ $? -eq 0 ]; then
    echo "✅ Changes committed successfully"
else
    echo "❌ Commit failed"
    exit 1
fi

echo ""
echo "🚀 Pushing to origin..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Push successful"
else
    echo "❌ Push failed"
    exit 1
fi

echo ""
echo "🎉 DEPLOYMENT INITIATED!"
echo "========================"
echo ""
echo "📍 Next Steps:"
echo "   1. Go to Render Dashboard"
echo "   2. Check backend service logs"
echo "   3. Look for these success messages:"
echo "      - ✅ Database migrations deployed successfully"
echo "      - ✅ Prisma client generated successfully"  
echo "      - ✅ Admin user setup completed"
echo "      - 🚀 Starting with node (production mode)"
echo ""
echo "🔑 Admin Login (after deployment):"
echo "   Username: admin"
echo "   Password: Admin123!"
echo "   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!"
echo ""
echo "🧪 Test Commands:"
echo "   curl https://your-backend.onrender.com/api/health"
echo ""
echo "📖 For details, see: DATABASE_MIGRATION_FIX_SUMMARY.md"