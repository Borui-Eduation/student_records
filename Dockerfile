# Multi-stage Dockerfile for Cloud Run
# Stage 1: Build everything in the monorepo
FROM node:20-alpine AS builder

WORKDIR /workspace

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all workspace packages
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/api/package.json ./apps/api/package.json

# Install pnpm and all dependencies (skip Puppeteer download)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install -g pnpm@9.12.2 && \
    pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package first
WORKDIR /workspace/packages/shared
RUN pnpm build

# Build API
WORKDIR /workspace/apps/api
RUN pnpm build

# Stage 2: Production runtime
FROM node:20-alpine

WORKDIR /app

# Install Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Install pnpm
RUN npm install -g pnpm@9.12.2

# Copy package files
COPY --from=builder /workspace/apps/api/package.json ./
COPY --from=builder /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /workspace/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy built artifacts
COPY --from=builder /workspace/apps/api/dist ./dist
COPY --from=builder /workspace/packages/shared ./packages/shared

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

# Set Puppeteer environment
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production \
    PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
