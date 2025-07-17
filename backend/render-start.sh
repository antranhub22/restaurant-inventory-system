#!/usr/bin/env bash

echo "🚀 Starting Restaurant Inventory Backend..."

# Make database fix script executable
chmod +x fix-render-database.sh

# Run comprehensive database setup and fix
echo "🔧 Running database setup and connection fix..."
./fix-render-database.sh

# If database fix failed, exit
if [ $? -ne 0 ]; then
    echo "❌ Database setup failed - exiting"
    exit 1
fi

# Start the server
echo "🌐 Starting server..."
npm start 