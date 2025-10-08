# Google Cloud Platform Setup Guide
# Google Cloud 平台设置指南

This guide covers tasks T005-T009 from the implementation plan.

---

## Prerequisites

- Google Account
- Credit card for billing (required even for free tier)
- `gcloud` CLI installed: https://cloud.google.com/sdk/docs/install

---

## T005: Configure Google Cloud Project

### 1. Create GCP Project

```bash
# Login to gcloud
gcloud auth login

# Create project
gcloud projects create student-record-prod --name="Student Record System"

# Set as active project
gcloud config set project student-record-prod

# Enable billing (do this in console: https://console.cloud.google.com/billing)
```

### 2. Enable Required APIs

```bash
gcloud services enable \
  firestore.googleapis.com \
  storage-api.googleapis.com \
  cloudkms.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  logging.googleapis.com
```

### 3. Set Up Billing Alerts

Go to: https://console.cloud.google.com/billing/alerts

Create alerts at:
- $5 (50% of expected)
- $10 (100% of expected)
- $20 (warning threshold)

### 4. Create Service Account

```bash
# Create service account
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

# Download key for local development
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=student-record-api@student-record-prod.iam.gserviceaccount.com

# IMPORTANT: Add to .gitignore!
echo "service-account-key.json" >> .gitignore
```

---

## T006: Initialize Firestore Database

```bash
# Create Firestore database (choose your region)
gcloud firestore databases create --region=asia-east1

# Deploy security rules
firebase deploy --only firestore:rules

# Create composite indexes
firebase deploy --only firestore:indexes
```

### Firestore Security Rules

Create `firestore.rules` in project root:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper: Check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email == 'your-admin-email@gmail.com';
    }
    
    // All collections: admin-only by default
    match /{document=**} {
      allow read, write: if isAdmin();
    }
    
    // Audit logs: append-only
    match /auditLogs/{logId} {
      allow create: if isAdmin();
      allow read: if isAdmin();
      allow update, delete: if false;
    }
  }
}
```

### Firestore Indexes

Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "clients",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "active", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "billingStatus", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "clientId", "order": "ASCENDING" },
        { "fieldPath": "issueDate", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## T007: Set Up Cloud Storage Buckets

```bash
# Create buckets
gsutil mb -l asia-east1 gs://student-record-prod
gsutil mb -l asia-east1 gs://student-record-staging

# Set CORS policy
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

# Clean up
rm cors.json
```

---

## T008: Configure Cloud KMS

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

# Grant service account access
gcloud kms keys add-iam-policy-binding sensitive-data-key \
  --keyring=student-record-keyring \
  --location=global \
  --member="serviceAccount:student-record-api@student-record-prod.iam.gserviceaccount.com" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"
```

---

## T009: Set Up Firebase Authentication

### 1. Link GCP Project to Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Link project
firebase projects:addfirebase student-record-prod
```

Or via Firebase Console: https://console.firebase.google.com/

### 2. Enable Authentication Providers

Go to Firebase Console → Authentication → Sign-in method

Enable:
- **Google** provider
  - Add support email
  - Whitelist your admin email
- **Email/Password** provider

### 3. Get Firebase Config

Go to Project Settings → General → Your apps

Add a Web app and copy the config:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "student-record-prod.firebaseapp.com",
  projectId: "student-record-prod",
  storageBucket: "student-record-prod.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

Save these values for environment variables (next step).

---

## Verification Checklist

After completing these steps, verify:

- [ ] GCP project created and billing enabled
- [ ] All required APIs enabled
- [ ] Billing alerts configured
- [ ] Service account created with proper roles
- [ ] Service account key downloaded
- [ ] Firestore database created in Native mode
- [ ] Firestore security rules deployed
- [ ] Firestore indexes created
- [ ] Cloud Storage buckets created with CORS
- [ ] Cloud KMS keyring and key created
- [ ] Firebase project linked
- [ ] Firebase Authentication providers enabled
- [ ] Firebase config obtained

---

## Next Steps

After completing this setup:

1. Update environment variables (T010) with your Firebase config and GCP project details
2. Continue with remaining implementation tasks
3. Test local development environment

---

## Estimated Costs

With the free tier limits:
- Firestore: 50K reads, 20K writes, 20K deletes per day (FREE)
- Cloud Storage: 5GB storage, 1GB egress per month (FREE)
- Cloud Run: 2M requests, 360K vCPU-seconds per month (FREE)
- Cloud KMS: 20K crypto operations per month (FREE)
- Firebase Auth: Unlimited users (FREE)

**Expected monthly cost for first 3 months: $0**

---

## Troubleshooting

### "Permission denied" errors
- Ensure service account has correct roles
- Check that you're using the correct project ID

### Firestore index errors
- Firestore will suggest creating indexes via error messages
- Click the link in the error to auto-create the index

### Storage CORS issues
- Verify CORS configuration with: `gsutil cors get gs://your-bucket`
- Update CORS if needed

---

## Support

- GCP Documentation: https://cloud.google.com/docs
- Firebase Documentation: https://firebase.google.com/docs
- Firestore Documentation: https://firebase.google.com/docs/firestore

