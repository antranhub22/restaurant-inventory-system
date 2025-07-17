#!/bin/bash

echo "🔧 Deploying Database Connection Fix..."

# Add all changes
git add -A

# Commit with descriptive message
git commit -m "🔧 Fix database connection for Render deployment

- Add database connection test in server startup
- Create check-database.js script for connection validation
- Update render-build.sh to include database setup
- Add database scripts to package.json
- Create comprehensive troubleshooting guides
- Improve error handling and logging"

# Push to main branch
git push origin main

echo "✅ Database fix deployed!"
echo ""
echo "📋 Next steps on Render:"
echo "1. Create PostgreSQL database service"
echo "2. Copy Internal Database URL" 
echo "3. Update DATABASE_URL environment variable"
echo "4. Manual deploy backend service"
echo "5. Check logs for successful connection"
echo ""
echo "📖 Read FIX_RENDER_DATABASE.md for detailed instructions"