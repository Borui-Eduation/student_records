# Getting Started
# 快速开始

Quick guide to get the Student Record Management System running locally.

---

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Google Cloud account (for production)
- Firebase project (for production)

---

## Local Development (Without Cloud Services)

For quick local development without setting up Google Cloud:

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build Shared Package

```bash
cd packages/shared
pnpm build
cd ../..
```

### 3. Set Up Environment Variables

**Frontend (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_ENV=development

# Firebase config (optional for local dev)
NEXT_PUBLIC_FIREBASE_API_KEY=test
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=test.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=test
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=test.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456
NEXT_PUBLIC_FIREBASE_APP_ID=test
```

**Backend (`apps/api/.env`):**
```env
NODE_ENV=development
PORT=8080
CORS_ORIGIN=http://localhost:3000

# Google Cloud (not needed for basic local dev)
# GOOGLE_CLOUD_PROJECT=your-project-id
# FIREBASE_PROJECT_ID=your-project-id
# GCS_BUCKET_NAME=your-bucket
# KMS_KEYRING=your-keyring
# KMS_KEY=your-key
# KMS_LOCATION=global

# Admin emails (comma-separated)
ADMIN_EMAILS=your-email@gmail.com
```

### 4. Run Development Servers

**Option A: Run all (recommended)**
```bash
pnpm dev
```

**Option B: Run individually**

Terminal 1 (Frontend):
```bash
cd apps/web
pnpm dev
```

Terminal 2 (Backend):
```bash
cd apps/api
pnpm dev
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Health check: http://localhost:8080/health

---

## Production Setup

For full production setup with Google Cloud services:

### 1. Complete Google Cloud Setup

Follow the complete guide in `docs/GOOGLE_CLOUD_SETUP.md`:

```bash
# This will set up:
# - Google Cloud Project
# - Firestore database
# - Cloud Storage buckets
# - Cloud KMS for encryption
# - Firebase Authentication
# - Service accounts
```

### 2. Update Environment Variables

Update both `.env.local` files with your actual Firebase credentials and GCP project IDs.

### 3. Deploy

Follow the deployment guide in `docs/DEPLOYMENT.md`:

- Frontend → Vercel
- Backend → Google Cloud Run

---

## Project Structure

```
student_record/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/      # Pages and layouts
│   │   │   ├── components/ # React components
│   │   │   └── lib/      # Utilities
│   │   └── package.json
│   └── api/              # Express + tRPC backend
│       ├── src/
│       │   ├── routers/  # API routes
│       │   ├── index.ts  # Server entry
│       │   └── trpc.ts   # tRPC setup
│       └── package.json
├── packages/
│   └── shared/           # Shared types & schemas
│       ├── src/
│       │   ├── types/    # TypeScript interfaces
│       │   └── schemas/  # Zod validation
│       └── package.json
├── docs/                 # Documentation
├── specs/                # Feature specifications
└── package.json          # Root package
```

---

## Common Tasks

### Add a New Dependency

```bash
# Frontend
pnpm --filter web add <package>

# Backend
pnpm --filter api add <package>

# Shared
pnpm --filter @student-record/shared add <package>
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

### Format Code

```bash
pnpm format
```

### Build for Production

```bash
# Build all packages
pnpm build

# Build individually
cd apps/web && pnpm build
cd apps/api && pnpm build
```

### Run Production Build Locally

```bash
# Frontend
cd apps/web
pnpm build
pnpm start

# Backend
cd apps/api
pnpm build
pnpm start
```

---

## Development Workflow

1. **Start development servers**: `pnpm dev`
2. **Make changes** to code
3. **Hot reload** kicks in automatically
4. **Test** changes in browser (http://localhost:3000)
5. **Commit** when ready: `git add . && git commit -m "message"`

---

## Troubleshooting

### "Module not found" errors

```bash
# Clean and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# Rebuild shared package
cd packages/shared && pnpm build
```

### Port already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Kill process on port 8080
lsof -ti:8080 | xargs kill
```

### TypeScript errors

```bash
# Rebuild shared types
cd packages/shared && pnpm build

# Check for errors
pnpm typecheck
```

### Firebase Auth not working locally

For local development, you can bypass Firebase Auth by:
1. Commenting out auth checks in `apps/api/src/trpc.ts`
2. Using mock user data

**Not recommended for production!**

---

## Next Steps

After getting the project running:

1. ✅ Review the architecture in `specs/001-/plan.md`
2. ✅ Check implementation status in `docs/IMPLEMENTATION_STATUS.md`
3. ✅ Read feature specs in `specs/001-/spec.md`
4. ✅ Set up Google Cloud (see `docs/GOOGLE_CLOUD_SETUP.md`)
5. ✅ Deploy to production (see `docs/DEPLOYMENT.md`)

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

## Support

If you encounter issues:

1. Check `docs/` folder for detailed guides
2. Review existing code for examples
3. Check Git commit history
4. Consult the specification in `specs/001-/`

---

## Current Implementation Status

**✅ Completed:**
- Project setup & monorepo structure
- Authentication system
- Basic UI components
- Client management (CRUD)
- tRPC API infrastructure

**🟡 In Progress:**
- Rates management
- Session recording
- Rich media integration

**⚪ Not Started:**
- Invoice generation
- Knowledge Base
- Sharing links
- PDF export

See `docs/IMPLEMENTATION_STATUS.md` for detailed progress tracking.


