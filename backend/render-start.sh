#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Starting restaurant inventory backend..."

# Push database schema (instead of migrations to avoid conflicts)
echo "📊 Setting up database schema..."
npx prisma db push --accept-data-loss

# Run reset and setup script
echo "🔄 Setting up initial data..."
node reset-database.js

echo "✅ Database setup complete!"

# Start the server
echo "🖥️ Starting server..."
node dist/server.js 