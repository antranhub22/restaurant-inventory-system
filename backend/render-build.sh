#!/usr/bin/env bash
# exit on error
set -o errexit

# Clean install dependencies without legacy peer deps
npm ci

# Install type definitions explicitly
npm install --save-dev @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors @types/compression @types/morgan

# Generate Prisma Client
npx prisma generate

# Build TypeScript
npm run build

echo "✅ Backend build completed!"