#!/usr/bin/env bash
# exit on error
set -o errexit

# Clean install dependencies
npm ci --legacy-peer-deps

# Generate Prisma Client
npx prisma generate

# Build TypeScript
npm run build

echo "✅ Backend build completed!"