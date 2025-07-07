#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
npm ci --production=false

# Generate Prisma Client
npx prisma generate

# Build TypeScript
npm run build

echo "✅ Backend build completed!"