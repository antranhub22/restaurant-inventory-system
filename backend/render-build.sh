#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
npm install

# Install type definitions explicitly
npm install --save-dev @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors @types/compression @types/morgan

# Generate Prisma Client
npx prisma generate

# Build TypeScript with verbose logging
npm run build -- --verbose

echo "✅ Backend build completed!"