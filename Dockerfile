# ==========================================
# Multi-stage Dockerfile for BarberBot Pro
# ==========================================

# Stage 1: Build Frontend and dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package manifests (both package.json and package-lock.json)
COPY package.json package-lock.json* ./

# Install all dependencies with --legacy-peer-deps to avoid npm Arborist edgesOut bug
RUN npm install --legacy-peer-deps

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

# Copy package files
COPY package.json package-lock.json* ./

# Copy ready node_modules from builder (avoids re-resolving dependencies)
COPY --from=builder /app/node_modules ./node_modules

# Install tsx globally in runner for server execution
RUN npm install -g tsx

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
