# Development Guide

## 🚀 Quick Start Scripts

We've created convenient scripts to handle port conflicts and service management automatically.

### Start Development Server

**Method 1: Using npm script (Recommended)**
```bash
pnpm dev:start
```

**Method 2: Direct script execution**
```bash
./dev-start.sh
```

This script will:
- ✅ Kill all existing Node processes
- ✅ Free up ports 3000 and 8080
- ✅ Clean build caches (.next, dist)
- ✅ Increase file descriptor limits
- ✅ Start frontend and backend services

### Stop Development Server

**Method 1: Using npm script**
```bash
pnpm dev:stop
```

**Method 2: Direct script execution**
```bash
./dev-stop.sh
```

This script will:
- ✅ Stop all Node processes
- ✅ Verify ports are freed
- ✅ Clean up resources

### Manual Development (Legacy)

If you prefer the traditional approach:
```bash
pnpm dev
```

**Note:** If you encounter port conflicts, use `pnpm dev:start` instead.

## 📝 Common Issues

### Port Already in Use
**Error:** `EADDRINUSE: address already in use :::8080` or `:::3000`

**Solution:** Run `pnpm dev:stop` followed by `pnpm dev:start`

### Too Many Open Files
**Error:** `EMFILE: too many open files`

**Solution:** The `dev-start.sh` script automatically increases the file descriptor limit to 65536

### Services Won't Start
1. Stop all services: `pnpm dev:stop`
2. Clean caches: `rm -rf apps/web/.next apps/api/dist node_modules/.cache`
3. Start services: `pnpm dev:start`

## 🌐 Access URLs

After starting the services:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **API Health:** http://localhost:8080/health
- **tRPC Endpoint:** http://localhost:8080/trpc

## 🔧 Other Useful Commands

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter=@student-record/shared
pnpm build --filter=web
pnpm build --filter=api

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Clean everything
pnpm clean
```

## 📦 Project Structure

```
student-record/
├── apps/
│   ├── web/          # Next.js frontend (Port 3000)
│   └── api/          # Express + tRPC backend (Port 8080)
├── packages/
│   └── shared/       # Shared types and schemas
├── dev-start.sh      # Start script
├── dev-stop.sh       # Stop script
└── package.json      # Root package with scripts
```

## 🐛 Debugging

If services start but pages return 404:
1. Wait for Next.js compilation to complete
2. Check terminal for "✓ Compiled successfully"
3. Refresh browser (Cmd+R or Ctrl+R)

If backend returns errors:
1. Check environment variables in `apps/api/.env.local`
2. Ensure Firebase credentials are configured
3. Check `http://localhost:8080/health` for API status



