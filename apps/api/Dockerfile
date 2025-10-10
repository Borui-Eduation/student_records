# Dockerfile for deploying API to Cloud Run
# Run from project root

FROM node:20-alpine

WORKDIR /app

# Copy package.json
COPY apps/api/package.json ./

# Install pnpm
RUN npm install -g pnpm@9.12.2

# Create node_modules structure for shared package
RUN mkdir -p node_modules/@student-record/shared

# Copy built shared package
COPY packages/shared/dist ./node_modules/@student-record/shared/dist
COPY packages/shared/package.json ./node_modules/@student-record/shared/

# Install dependencies (excluding workspace packages)
RUN pnpm install --prod --no-frozen-lockfile

# Copy built API dist folder
COPY apps/api/dist ./dist

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/index.js"]

