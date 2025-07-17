#!/usr/bin/env bash

echo "🚀 Starting Restaurant Inventory Backend..."

# Check if database is accessible
echo "🔍 Checking database connection..."
npm run db:check

# Start the server
echo "🌐 Starting server..."
npm start 