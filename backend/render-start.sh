#!/usr/bin/env bash

echo "🚀 Starting Restaurant Inventory Backend..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Generate Prisma Client (in case of any schema changes)
echo "🔄 Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma db push --accept-data-loss

# Seed database with initial data
echo "🌱 Seeding database..."
npm run seed || echo "⚠️ Seed failed or already exists"

# Check if database is accessible
echo "🔍 Final database connection check..."
npm run db:check

# Start the server
echo "🌐 Starting server..."
npm start 