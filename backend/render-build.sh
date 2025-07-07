#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🧹 Cleaning up old dependencies..."
rm -rf node_modules
rm -rf dist

echo "🔧 Installing dependencies..."
# Install all dependencies including dev dependencies
npm install --production=false

echo "📦 Generating Prisma Client..."
# Generate Prisma Client
npx prisma generate

echo "🏗️ Building TypeScript..."
# Build TypeScript
npm run build

echo "✅ Backend build completed!"