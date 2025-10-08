# Developer Quickstart Guide
# 开发者快速入门指南

**Last Updated:** 2025-10-08  
**Estimated Setup Time:** 30-45 minutes  
**Prerequisites:** Basic knowledge of TypeScript, React, and Node.js

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Google Cloud Setup](#google-cloud-setup)
4. [Firebase Setup](#firebase-setup)
5. [Local Development](#local-development)
6. [Deployment](#deployment)
7. [Common Issues](#common-issues)
8. [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

Install the following tools before beginning:

| Tool | Version | Installation |
|------|---------|--------------|
| **Node.js** | 20.x LTS | [Download](https://nodejs.org/) |
| **pnpm** | 8.x+ | `npm install -g pnpm` |
| **Git** | Latest | [Download](https://git-scm.com/) |
| **VS Code** | Latest | [Download](https://code.visualstudio.com/) |
| **Docker Desktop** | Latest | [Download](https://www.docker.com/products/docker-desktop/) |
| **Google Cloud SDK** | Latest | [Download](https://cloud.google.com/sdk/docs/install) |
| **Firebase CLI** | Latest | `npm install -g firebase-tools` |

### Required Accounts

1. **GitHub Account** - For code repository
2. **Google Cloud Platform Account** - With billing enabled
3. **Vercel Account** - Free tier sufficient
4. **SendGrid Account** - Free tier sufficient

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-azuretools.vscode-docker",
    "firebase.vscode-firestore-explorer"
  ]
}
```

---

## Project Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/student-record.git
cd student-record

# Checkout the feature branch
git checkout 001-
```

### 2. Install Dependencies

```bash
# Install all dependencies using pnpm
pnpm install

# This will install dependencies for:
# - Root workspace
# - apps/web (Next.js frontend)
# - apps/api (Express backend)
# - packages/shared (shared types and utilities)
```

### 3. Project Structure

```
student-record/
├── apps/
│   ├── web/                    # Next.js 14 frontend
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   ├── lib/               # Utilities
│   │   └── public/            # Static assets
│   │
│   └── api/                    # Express + tRPC backend
│       ├── src/
│       │   ├── routers/       # tRPC routers
│       │   ├── services/      # Business logic
│       │   ├── middleware/    # Express middleware
│       │   └── index.ts       # Entry point
│       └── Dockerfile
│
├── packages/
│   └── shared/                 # Shared TypeScript code
│       ├── src/
│       │   ├── types/         # Type definitions
│       │   └── schemas/       # Zod validation schemas
│       └── package.json
│
├── .env.example               # Environment variables template
├── pnpm-workspace.yaml        # pnpm workspace config
├── turbo.json                 # Turborepo config
└── package.json               # Root package.json
```

---

## Google Cloud Setup

### 1. Create New Project

```bash
# Login to Google Cloud
gcloud auth login

# Create new project
gcloud projects create student-record-prod --name="Student Record System"

# Set as active project
gcloud config set project student-record-prod

# Enable billing (required for free tier services)
# Visit: https://console.cloud.google.com/billing
```

### 2. Enable Required APIs

```bash
# Enable all required Google Cloud APIs
gcloud services enable \
  firestore.googleapis.com \
  storage-api.googleapis.com \
  cloudkms.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  logging.googleapis.com
```

### 3. Create Firestore Database

```bash
# Create Firestore database in Native mode
gcloud firestore databases create --region=asia-east1

# Note: Choose region closest to your location
# Options: us-central1, europe-west1, asia-east1, etc.
```

### 4. Create Cloud Storage Buckets

```bash
# Create buckets for file storage
gsutil mb -l asia-east1 gs://student-record-prod
gsutil mb -l asia-east1 gs://student-record-staging

# Set CORS policy for browser uploads
cat > cors.json <<EOF
[
  {
    "origin": ["http://localhost:3000", "https://your-domain.vercel.app"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://student-record-prod
gsutil cors set cors.json gs://student-record-staging
```

### 5. Create Cloud KMS Keyring & Key

```bash
# Create keyring
gcloud kms keyrings create student-record-keyring \
  --location=global

# Create encryption key with auto-rotation
gcloud kms keys create sensitive-data-key \
  --keyring=student-record-keyring \
  --location=global \
  --purpose=encryption \
  --rotation-period=90d \
  --next-rotation-time=$(date -u -d "+90 days" +%Y-%m-%dT%H:%M:%SZ)
```

### 6. Create Service Account

```bash
# Create service account for backend
gcloud iam service-accounts create student-record-api \
  --display-name="Student Record API Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding student-record-prod \
  --member="serviceAccount:student-record-api@student-record-prod.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding student-record-prod \
  --member="serviceAccount:student-record-api@student-record-prod.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding student-record-prod \
  --member="serviceAccount:student-record-api@student-record-prod.iam.gserviceaccount.com" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"

# Download service account key (for local development only)
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=student-record-api@student-record-prod.iam.gserviceaccount.com

# IMPORTANT: Add this file to .gitignore!
echo "service-account-key.json" >> .gitignore
```

---

## Firebase Setup

### 1. Create Firebase Project

```bash
# Login to Firebase
firebase login

# Link Google Cloud project to Firebase
firebase projects:addfirebase student-record-prod
```

Alternatively, use [Firebase Console](https://console.firebase.google.com/):
1. Click "Add Project"
2. Select existing Google Cloud project: `student-record-prod`
3. Confirm Firebase billing plan (free tier)

### 2. Enable Firebase Authentication

Via [Firebase Console](https://console.firebase.google.com/):

1. Go to **Authentication** → **Sign-in method**
2. Enable **Google** provider:
   - Add support email
   - Whitelist your admin email
3. Enable **Email/Password** provider

### 3. Get Firebase Config

```bash
# Get Firebase config for web app
firebase apps:create WEB student-record-web

# Note the config values displayed, you'll need them for .env
```

Or via Firebase Console:
1. Go to **Project Settings** → **General**
2. Under "Your apps", add a Web app
3. Copy the Firebase config object

### 4. Set Up Firestore Security Rules

```bash
# Navigate to project root
cd student-record

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

**firestore.rules** (create this file in project root):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper: Check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email in [
               'your-admin-email@gmail.com'  // REPLACE WITH YOUR EMAIL
             ];
    }
    
    // All collections: admin-only access by default
    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

### 5. Create Firestore Indexes

Via Firebase Console:
1. Go to **Firestore Database** → **Indexes**
2. Create composite indexes as defined in `docs/data-model.md`

Or wait for Firestore to suggest indexes during development (it will show errors with index creation links).

---

## Local Development

### 1. Environment Variables

Create `.env.local` files in both frontend and backend:

**apps/web/.env.local** (Next.js):

```bash
# Firebase Config (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=student-record-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=student-record-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=student-record-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# API URL (local development)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Environment
NEXT_PUBLIC_ENV=development
```

**apps/api/.env** (Express Backend):

```bash
# Google Cloud
GOOGLE_CLOUD_PROJECT=student-record-prod
GOOGLE_APPLICATION_CREDENTIALS=../../service-account-key.json
GCS_BUCKET_NAME=student-record-prod

# Firebase Admin
FIREBASE_PROJECT_ID=student-record-prod

# Cloud KMS
KMS_KEYRING=student-record-keyring
KMS_KEY=sensitive-data-key
KMS_LOCATION=global

# SendGrid
SENDGRID_API_KEY=SG.your-api-key-here

# Server
PORT=8080
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 2. Start Development Servers

```bash
# Terminal 1: Start backend API
cd apps/api
pnpm dev

# Backend will start on http://localhost:8080

# Terminal 2: Start frontend
cd apps/web
pnpm dev

# Frontend will start on http://localhost:3000
```

### 3. Verify Setup

Open http://localhost:3000 in your browser:

1. ✅ Page loads without errors
2. ✅ Can sign in with Google OAuth
3. ✅ Can access authenticated pages
4. ✅ tRPC API calls work (check Network tab)

### 4. Development Workflow

```bash
# Run all checks before committing
pnpm lint           # Run ESLint
pnpm format         # Run Prettier
pnpm typecheck      # TypeScript type checking
pnpm test           # Run tests

# Build for production (to verify)
pnpm build

# Run in production mode locally
pnpm start
```

---

## Deployment

### Frontend Deployment (Vercel)

#### 1. Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `cd ../.. && pnpm build --filter=web`
   - **Output Directory:** `apps/web/.next`
5. Add environment variables (same as `.env.local`)
6. Click "Deploy"

#### 2. Environment Variables

Add all `NEXT_PUBLIC_*` variables from `.env.local` in Vercel dashboard:
- Project Settings → Environment Variables
- Add for **Production**, **Preview**, and **Development**

#### 3. Custom Domain (Optional)

- Project Settings → Domains
- Add your custom domain and follow DNS configuration steps

---

### Backend Deployment (Cloud Run)

#### 1. Build and Push Docker Image

```bash
# Navigate to API directory
cd apps/api

# Build Docker image
docker build -t gcr.io/student-record-prod/api:latest .

# Push to Google Container Registry
docker push gcr.io/student-record-prod/api:latest
```

#### 2. Deploy to Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy student-record-api \
  --image gcr.io/student-record-prod/api:latest \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --service-account student-record-api@student-record-prod.iam.gserviceaccount.com \
  --set-env-vars "FIREBASE_PROJECT_ID=student-record-prod,GCS_BUCKET_NAME=student-record-prod,KMS_KEYRING=student-record-keyring,KMS_KEY=sensitive-data-key,KMS_LOCATION=global,NODE_ENV=production" \
  --set-secrets "SENDGRID_API_KEY=sendgrid-api-key:latest" \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 60s

# Note the URL displayed after deployment
```

#### 3. Store Secrets

```bash
# Store SendGrid API key in Secret Manager
echo -n "SG.your-actual-sendgrid-key" | \
  gcloud secrets create sendgrid-api-key --data-file=-

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding sendgrid-api-key \
  --member="serviceAccount:student-record-api@student-record-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### 4. Update Frontend API URL

After Cloud Run deployment, update `NEXT_PUBLIC_API_URL` in Vercel:
- Change from local URL to your Cloud Run URL
- Redeploy frontend

---

### Continuous Deployment (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: student-record-prod
          service_account_key: ${{ secrets.GCP_SA_KEY }}
      
      - name: Build and Push Docker Image
        run: |
          cd apps/api
          docker build -t gcr.io/student-record-prod/api:${{ github.sha }} .
          docker push gcr.io/student-record-prod/api:${{ github.sha }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy student-record-api \
            --image gcr.io/student-record-prod/api:${{ github.sha }} \
            --platform managed \
            --region asia-east1 \
            --allow-unauthenticated
```

---

## Common Issues

### Issue 1: Firestore Permission Denied

**Error:** `Missing or insufficient permissions`

**Solution:**
1. Check Firestore security rules allow your admin email
2. Verify you're signed in with correct account
3. Check service account has `roles/datastore.user`

### Issue 2: CORS Errors

**Error:** `Access to fetch at 'http://localhost:8080' has been blocked by CORS`

**Solution:**
1. Check `CORS_ORIGIN` in backend `.env` matches frontend URL
2. Restart backend server after changing environment variables
3. Clear browser cache

### Issue 3: Cloud KMS Access Denied

**Error:** `Permission 'cloudkms.cryptoKeyVersions.useToEncrypt' denied`

**Solution:**
```bash
# Grant KMS permissions to service account
gcloud projects add-iam-policy-binding student-record-prod \
  --member="serviceAccount:student-record-api@student-record-prod.iam.gserviceaccount.com" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"
```

### Issue 4: Next.js Build Fails

**Error:** `Module not found: Can't resolve '@/components/...'`

**Solution:**
- Check `tsconfig.json` has correct path aliases
- Run `pnpm install` again
- Delete `.next` folder and rebuild

### Issue 5: Docker Build Fails

**Error:** `npm ERR! code ENOENT`

**Solution:**
- Ensure `package.json` and `pnpm-lock.yaml` are in correct locations
- Check Dockerfile COPY paths are correct
- Use multi-stage build to separate dependencies

---

## Next Steps

### 1. Initialize Company Profile

```typescript
// Run this once in Firestore Console or via API
{
  "id": "default",
  "companyName": "Your Company Name",
  "taxId": "YOUR-TAX-ID",
  "address": "Your Address",
  "bankInfo": {
    "bankName": "Your Bank",
    "accountNumber": "123456789",
    "accountName": "Your Company Name"
  },
  "contactInfo": {
    "email": "your-email@example.com",
    "phone": "+1234567890"
  },
  "updatedAt": "2025-10-08T00:00:00Z",
  "updatedBy": "admin_uid"
}
```

### 2. Create First Client

Use the frontend UI or Firestore Console to create your first test client.

### 3. Test Session Recording

1. Create a session for the test client
2. Add content using Tiptap editor
3. Draw on Excalidraw whiteboard
4. Record audio
5. Verify all media saves correctly

### 4. Generate Test Invoice

1. Create 2-3 sessions
2. Navigate to Invoicing page
3. Select sessions and generate invoice
4. Verify PDF generation
5. Check invoice appears in list

### 5. Set Up Monitoring

- Enable Cloud Logging alerts
- Set up Sentry for error tracking
- Configure billing alerts ($5, $10, $20 thresholds)

---

## Useful Commands

```bash
# pnpm commands
pnpm dev              # Start all dev servers
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm format           # Format all code
pnpm typecheck        # TypeScript check all packages
pnpm clean            # Clean all build artifacts

# Firestore commands
firebase firestore:delete --all-collections    # Delete all data (caution!)
firebase firestore:indexes                     # List indexes

# Cloud Run commands
gcloud run services list                       # List services
gcloud run services describe student-record-api  # Service details
gcloud run services delete student-record-api    # Delete service

# Logs
gcloud logging read "resource.type=cloud_run_revision"  # View logs
```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tiptap Documentation](https://tiptap.dev/introduction)

---

## Support

For issues or questions:
1. Check this guide first
2. Review the [data model documentation](./data-model.md)
3. Check [implementation plan](../plan.md)
4. Open an issue in the repository

---

**Happy coding! 🚀**

