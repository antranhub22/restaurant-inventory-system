# Use Node.js 18 as base image
FROM node:18-slim

# Install dependencies for Tesseract
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-vie \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev deps for build)
RUN npm ci --include=dev

# Copy app source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Verify build output
RUN ls -la dist/ && echo "Build verification complete"

# Remove dev dependencies after build to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Make scripts executable
RUN chmod +x render-start.sh

# Expose port
EXPOSE 4000

# Start command with database setup
CMD ["./render-start.sh"] 