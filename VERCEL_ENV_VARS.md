# Vercel 环境变量配置

## 在 Vercel Dashboard 中配置以下环境变量：

### Firebase 配置（前端）
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAX5jhVczQ9dvHig3_h6fyRQHSRzub8olU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=borui-education-c6666.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=borui-education-c6666
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=borui-education-c6666.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=629935238761
NEXT_PUBLIC_FIREBASE_APP_ID=1:629935238761:web:8877023b2a2195a6aefcf8
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-7EZLZER4NJ
```

### API 配置（前端）
```
NEXT_PUBLIC_API_URL=https://your-vercel-url.vercel.app/api
```
注意：部署后需要更新为实际的 Vercel URL

### Google Cloud 配置（后端 - Serverless Function）
```
NODE_ENV=production
GOOGLE_CLOUD_PROJECT=borui-education-c6666
FIREBASE_PROJECT_ID=borui-education-c6666
GCS_BUCKET_NAME=borui-education-c6666-storage-usw1
KMS_KEY_RING=student-record-keyring
KMS_KEY_NAME=knowledge-base-key
KMS_LOCATION=us-west1
ADMIN_EMAILS=yao.s.1216@gmail.com
CORS_ORIGIN=https://your-vercel-url.vercel.app
```

### Google Cloud 服务账号（重要）
需要创建一个服务账号 JSON 密钥并将其内容设置为环境变量：
```
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"borui-education-c6666",...}
```

## 如何获取服务账号密钥：
1. 访问: https://console.cloud.google.com/iam-admin/serviceaccounts?project=borui-education-c6666
2. 创建或选择现有服务账号
3. 创建 JSON 密钥
4. 将整个 JSON 文件内容复制到 GOOGLE_APPLICATION_CREDENTIALS_JSON

## Vercel 项目配置：
- Framework Preset: Next.js
- Root Directory: apps/web
- Build Command: cd ../.. && pnpm install && pnpm build
- Output Directory: .next
- Install Command: pnpm install

