#!/usr/bin/env bash
# exit on error
set -o errexit

# Print environment variables for debugging
echo "🔧 Environment variables:"
echo "VITE_API_URL: $VITE_API_URL"
echo "VITE_ENV: $VITE_ENV"

# Install dependencies
npm ci

# Build for production với biến môi trường từ Render
npm run build

echo "✅ Frontend build completed!"