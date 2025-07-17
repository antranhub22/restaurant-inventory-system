# Use Node.js 18 as base image
FROM node:18-slim

# Install dependencies for Tesseract and debugging tools
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-vie \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev deps for build)
RUN npm ci --include=dev

# Copy app source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript with verification
RUN npm run build

# Verify critical files exist
RUN echo "🔍 Verifying build output..." && \
    ls -la dist/ && \
    test -f dist/server.js && echo "✅ dist/server.js exists" || (echo "❌ dist/server.js missing" && exit 1) && \
    test -f dist/app.js && echo "✅ dist/app.js exists" || echo "⚠️ dist/app.js missing (not critical)" && \
    echo "✅ Build verification complete"

# Remove dev dependencies after build to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Make scripts executable
RUN chmod +x render-start.sh render-build.sh

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

# Start command with proper error handling
CMD ["./render-start.sh"] 