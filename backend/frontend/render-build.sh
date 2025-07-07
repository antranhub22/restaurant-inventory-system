#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
npm ci

# Build for production
npm run build

echo "✅ Frontend build completed!"