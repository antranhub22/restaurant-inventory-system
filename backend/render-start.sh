#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Starting restaurant inventory backend..."

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until npx prisma db execute --command "SELECT 1;" --url "$DATABASE_URL" >/dev/null 2>&1; do
  echo "Database not ready, waiting 5 seconds..."
  sleep 5
done
echo "✅ PostgreSQL is ready!"

# Deploy database schema using push (for production)
echo "📊 Deploying database schema..."
npx prisma db push --accept-data-loss

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Run database setup
echo "🔄 Setting up initial data..."
node reset-database.js

echo "✅ Database setup complete!"

# Start the server
echo "🖥️ Starting server..."
node dist/server.js 