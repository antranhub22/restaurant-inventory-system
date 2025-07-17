# Migration Trigger

This file triggers a redeploy to ensure database migrations are run properly.

**Changes made:**
- Added `force-migrate.js` script for reliable migration execution
- Updated `render-build.sh` to run migrations during build process
- Added fallback migration logic in startup script

**Expected behavior:**
1. During build: Attempt to run migrations if DATABASE_URL is available
2. During startup: Retry migrations if they failed during build
3. Fallback: Use `prisma db push` if migrations fail

Timestamp: $(date)