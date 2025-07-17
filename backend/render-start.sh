#!/usr/bin/env bash

echo "🚀 Starting Restaurant Inventory Backend..."

# Make database fix scripts executable
chmod +x fix-render-database.sh
chmod +x render-database-fix-enhanced.sh

# Try enhanced database fix first, fallback to original if needed
echo "🔧 Running enhanced database setup and connection fix..."
if ./render-database-fix-enhanced.sh; then
    echo "✅ Enhanced database fix completed successfully"
elif ./fix-render-database.sh; then
    echo "✅ Fallback database fix completed"
else
    echo "❌ All database setup attempts failed"
    echo "🚨 Manual intervention required - check logs above"
    exit 1
fi

# Start the server
echo "🌐 Starting server..."
npm start 