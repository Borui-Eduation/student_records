# Deployment Guide
# 部署指南

This guide covers deploying the application to production (T014-T015).

---

## Prerequisites

- Completed Google Cloud Setup (see `GOOGLE_CLOUD_SETUP.md`)
- Vercel account: https://vercel.com/signup
- Project code pushed to GitHub
- All environment variables configured

---

## T014: Deploy Frontend to Vercel

### 1. Connect GitHub Repository to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project settings:

**Framework Preset:** Next.js  
**Root Directory:** `apps/web`  
**Build Command:** `cd ../.. && pnpm install && pnpm build --filter=web`  
**Output Directory:** `apps/web/.next`  
**Install Command:** `pnpm install`

### 2. Configure Environment Variables

In Vercel dashboard, go to: Project Settings → Environment Variables

Add all variables from `apps/web/.env.example`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=student-record-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=student-record-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=student-record-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_API_URL=https://your-api-url.run.app
NEXT_PUBLIC_ENV=production
```

**Important:** Set these for **Production**, **Preview**, and **Development** environments.

### 3. Deploy

Click "Deploy"

Vercel will:
- Install dependencies
- Build Next.js app
- Deploy to CDN
- Provide preview URL

### 4. Custom Domain (Optional)

Go to: Project Settings → Domains

Add your custom domain and follow DNS configuration steps.

### 5. Verify Deployment

Visit your Vercel URL and verify:
- [ ] Homepage loads
- [ ] Assets load correctly (CSS, fonts)
- [ ] No console errors

---

## T015: Deploy Backend to Cloud Run

### 1. Build Docker Image

```bash
cd apps/api

# Build image
docker build -t gcr.io/student-record-prod/api:latest .

# Test locally (optional)
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e GOOGLE_CLOUD_PROJECT=student-record-prod \
  gcr.io/student-record-prod/api:latest

# Verify: http://localhost:8080/health
```

### 2. Push Image to Google Container Registry

```bash
# Configure docker for GCR
gcloud auth configure-docker

# Push image
docker push gcr.io/student-record-prod/api:latest
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy student-record-api \
  --image gcr.io/student-record-prod/api:latest \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --service-account student-record-api@student-record-prod.iam.gserviceaccount.com \
  --set-env-vars "NODE_ENV=production,GOOGLE_CLOUD_PROJECT=student-record-prod,GCS_BUCKET_NAME=student-record-prod,KMS_KEYRING=student-record-keyring,KMS_KEY=sensitive-data-key,KMS_LOCATION=global,FIREBASE_PROJECT_ID=student-record-prod" \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 60s
```

### 4. Configure Secrets (Optional)

For sensitive environment variables, use Secret Manager:

```bash
# Create secret
echo -n "your-sendgrid-api-key" | \
  gcloud secrets create sendgrid-api-key --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding sendgrid-api-key \
  --member="serviceAccount:student-record-api@student-record-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Update Cloud Run to use secret
gcloud run services update student-record-api \
  --set-secrets="SENDGRID_API_KEY=sendgrid-api-key:latest"
```

### 5. Get API URL

```bash
gcloud run services describe student-record-api \
  --region asia-east1 \
  --format="value(status.url)"
```

Copy this URL and update `NEXT_PUBLIC_API_URL` in Vercel environment variables.

### 6. Verify Deployment

```bash
# Health check
curl https://your-api-url.run.app/health

# Should return: {"status":"ok","message":"API is running"}
```

---

## Post-Deployment

### 1. Update Frontend API URL

Go back to Vercel dashboard:
1. Update `NEXT_PUBLIC_API_URL` with your Cloud Run URL
2. Trigger a new deployment

### 2. Configure Cloud Run Custom Domain (Optional)

```bash
gcloud run domain-mappings create \
  --service student-record-api \
  --domain api.your-domain.com \
  --region asia-east1
```

Follow DNS configuration instructions.

### 3. Set Up Continuous Deployment (CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
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
            --region asia-east1
```

Add secrets to GitHub:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `GCP_SA_KEY` (service account JSON)

---

## Monitoring & Logging

### Cloud Run Logs

```bash
# View logs
gcloud run services logs read student-record-api \
  --region asia-east1 \
  --limit 50

# Stream logs
gcloud run services logs tail student-record-api \
  --region asia-east1
```

### Set Up Alerts

Go to: Cloud Console → Monitoring → Alerting

Create alerts for:
- Error rate > 5%
- Latency P95 > 2 seconds
- Request count (unusual spikes)

---

## Rollback

### Frontend (Vercel)

Go to: Deployments → Select previous deployment → "Promote to Production"

### Backend (Cloud Run)

```bash
# List revisions
gcloud run revisions list \
  --service student-record-api \
  --region asia-east1

# Rollback to specific revision
gcloud run services update-traffic student-record-api \
  --to-revisions REVISION_NAME=100 \
  --region asia-east1
```

---

## Cost Monitoring

Set up billing exports:

```bash
gcloud beta billing accounts list

# Enable billing export to BigQuery
gcloud beta billing export create \
  --billing-account=BILLING_ACCOUNT_ID \
  --dataset-id=billing_export \
  --project-id=student-record-prod
```

Monitor costs:
- Cloud Console → Billing → Reports
- Set up budget alerts

---

## Security Checklist

Before production launch:

- [ ] All environment variables secured
- [ ] No secrets in source code
- [ ] Firestore security rules deployed
- [ ] Cloud Run uses service account (not default)
- [ ] CORS configured correctly
- [ ] HTTPS only (enforced by Cloud Run and Vercel)
- [ ] Admin email whitelisted in Firestore rules
- [ ] Billing alerts configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy defined

---

## Troubleshooting

### Build Fails on Vercel

- Check build logs in Vercel dashboard
- Verify `pnpm-workspace.yaml` configuration
- Ensure all dependencies in `package.json`
- Test build locally: `pnpm build --filter=web`

### Docker Build Fails

- Verify Dockerfile syntax
- Check `.dockerignore` isn't excluding required files
- Test build locally: `docker build -t test .`

### Cloud Run Deployment Fails

- Check image exists in GCR: `gcloud container images list`
- Verify service account permissions
- Check Cloud Run quota limits

### API Not Accessible

- Verify `--allow-unauthenticated` flag was set
- Check Cloud Run logs for errors
- Verify health check endpoint works
- Check firewall rules (shouldn't be needed for Cloud Run)

---

## Next Steps

After successful deployment:

1. Test all features in production
2. Set up monitoring dashboards
3. Configure automated backups
4. Document runbook procedures
5. Plan regular maintenance windows

---

## Support

- Cloud Run Documentation: https://cloud.google.com/run/docs
- Vercel Documentation: https://vercel.com/docs
- GitHub Actions: https://docs.github.com/en/actions

