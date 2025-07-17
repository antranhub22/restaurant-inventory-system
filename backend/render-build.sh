#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🧹 Cleaning up old dependencies..."
rm -rf node_modules
rm -rf dist

echo "🔧 Installing dependencies..."
# Install all dependencies including dev dependencies for build
npm ci

echo "📦 Verifying TypeScript installation..."
npx tsc --version

echo "🔍 Checking type definitions..."
ls -la node_modules/@types/ | grep -E "(express|jest|node)" || echo "Type definitions not found"

echo "📦 Generating Prisma Client..."
# Generate Prisma Client
npx prisma generate

echo "🗄️ Setting up database..."
# Push database schema
npx prisma db push --accept-data-loss

echo "🌱 Seeding database..."
# Seed initial data
npx prisma db seed

echo "🏗️ Building TypeScript..."
# Force TypeScript to include all type definitions
NODE_ENV=development npm run build

echo "🔍 Checking database connection..."
# Test database connectivity
npm run db:check

echo "✅ Backend build completed!"