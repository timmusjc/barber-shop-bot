# ==========================================
# Multi-stage Dockerfile for BarberBot Pro
# ==========================================

# Stage 1: Build Frontend and dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy source code and config files
COPY tsconfig.json vite.config.ts server.ts index.html metadata.json ./
COPY src/ ./src/

# Build production bundle
RUN npm run build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files and install production dependencies + tsx runner
COPY package.json ./
RUN npm install --omit=dev && npm install -g tsx

# Copy built frontend assets from builder
COPY --from=builder /app/dist ./dist

# Copy backend server script and configuration
COPY server.ts tsconfig.json ./

# Expose app port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["tsx", "server.ts"]
