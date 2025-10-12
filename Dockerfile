# Multi-stage Dockerfile for Cloud Run - Optimized
# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /workspace

# Install pnpm
RUN npm install -g pnpm@9.12.2

# Copy package files for caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/api/package.json ./apps/api/package.json

# Install all dependencies (frozen lockfile for reproducibility)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /workspace

# Copy dependencies from previous stage
COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=dependencies /workspace/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=dependencies /workspace/apps/api/node_modules ./apps/api/node_modules

# Copy source code
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Install pnpm
RUN npm install -g pnpm@9.12.2

# Build shared package
WORKDIR /workspace/packages/shared
RUN pnpm build

# Build API
WORKDIR /workspace/apps/api
RUN pnpm build

# Stage 3: Production runtime (minimal)
FROM node:20-alpine AS runtime

WORKDIR /app

# Install only runtime dependencies (if needed)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

# Install pnpm
RUN npm install -g pnpm@9.12.2

# Copy package files
COPY --from=builder /workspace/package.json /workspace/pnpm-lock.yaml /workspace/pnpm-workspace.yaml ./
COPY --from=builder /workspace/apps/api/package.json ./package.json

# Copy built artifacts
COPY --from=builder /workspace/apps/api/dist ./dist
COPY --from=builder /workspace/packages/shared/dist ./packages/shared/dist
COPY --from=builder /workspace/packages/shared/package.json ./packages/shared/package.json

# Install only production dependencies (no dev dependencies)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts || pnpm install --prod --ignore-scripts

# Remove pnpm to reduce image size
RUN npm uninstall -g pnpm && npm cache clean --force

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production \
    PORT=8080

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8080

# Healthcheck with improved reliability
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
