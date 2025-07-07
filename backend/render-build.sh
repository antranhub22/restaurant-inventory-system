#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🔧 Installing dependencies..."
# Clean install with legacy peer deps to avoid issues
npm ci --legacy-peer-deps

echo "📦 Generating Prisma Client..."
# Generate Prisma Client
npx prisma generate

echo "🏗️ Building TypeScript..."
# Build TypeScript
npm run build

echo "✅ Backend build completed!"