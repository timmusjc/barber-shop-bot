# ==========================================
# Multi-stage Dockerfile for BarberBot Pro
# Using Debian glibc (node:20-slim) to support all architectures
# (x86_64 and ARM64 / Apple Silicon / AWS Graviton / Hetzner ARM)
# ==========================================

# Stage 1: Build Frontend and dependencies
FROM node:20-slim AS builder

WORKDIR /app

# Copy package.json (we intentionally do not copy a host package-lock.json
# to avoid npm issue #4828 where native bindings like rolldown/esbuild
# are locked to the wrong host OS or architecture)
COPY package.json ./

# Install dependencies for the container's architecture
RUN npm install --legacy-peer-deps

# Copy source code and config files
COPY tsconfig.json vite.config.ts server.ts index.html metadata.json ./
COPY src/ ./src/

# Build production bundle
RUN npm run build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for Docker healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifest
COPY package.json ./

# Copy ready node_modules from builder (already compiled for this architecture)
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
