# Dockerfile for Next.js web app
FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm@9.12.2

WORKDIR /app

# Copy root package files
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./

# Copy shared package
COPY ../../packages/shared ./packages/shared

# Copy web app
COPY . ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
WORKDIR /app/packages/shared
RUN pnpm build

# Build web app
WORKDIR /app/apps/web
RUN pnpm build

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the app
CMD ["pnpm", "start"]

