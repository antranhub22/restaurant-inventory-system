#!/usr/bin/env bash
# exit on error
set -o errexit

# Run database migrations
npx prisma migrate deploy

# Start the server
node dist/app.js