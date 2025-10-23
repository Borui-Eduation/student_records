# 环境变量配置指南

## 📍 Region 配置（重要！）

**所有服务统一使用 `us-west1` region：**

| 服务 | Region 配置位置 | 当前值 |
|------|----------------|--------|
| Firestore | Firebase Console | us-west1 |
| Cloud KMS | `env-vars.yaml` | us-west1 |
| Cloud Run | `deploy-cloudrun.sh` | us-west1 |
| Cloud Storage | 创建 bucket 时指定 | us-west1 |

## 🔧 本地开发环境配置

### 后端 API (`apps/api/.env`)

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=borui-education-c6666
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@borui-education-c6666.iam.gserviceaccount.com"

# 管理员配置
SUPER_ADMIN_EMAIL=yao.s.1216@gmail.com
ADMIN_EMAILS=yao.s.1216@gmail.com

# Google Cloud KMS (us-west1)
KMS_LOCATION=us-west1
KMS_KEY_RING=student-record-keyring
KMS_KEY_NAME=knowledge-base-key

# CORS (本地开发)
CORS_ORIGIN=http://localhost:3000
```

### 前端 Web (`apps/web/.env.local`)

```bash
# API URL (本地开发)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Firebase 前端配置
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=borui-education-c6666.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=borui-education-c6666
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=borui-education-c6666.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Cloud Messaging (推送通知)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

**如何获取 VAPID Key：**
1. 打开 [Firebase Console](https://console.firebase.google.com)
2. 进入项目设置 > Cloud Messaging
3. 在"Web 推送证书"部分，点击"生成密钥对"
4. 复制生成的 VAPID key 到上述环境变量

## ☁️ 生产环境配置

### Cloud Run (后端)

配置文件：`deploy-cloudrun.sh` 和 `env-vars.yaml`

```yaml
NODE_ENV: production
GOOGLE_CLOUD_PROJECT: borui-education-c6666
FIREBASE_PROJECT_ID: borui-education-c6666
KMS_LOCATION: us-west1  # ✅ 确保使用 us-west1
KMS_KEY_RING: student-record-keyring
KMS_KEY_NAME: knowledge-base-key
ADMIN_EMAILS: yao.s.1216@gmail.com
SUPER_ADMIN_EMAIL: yao.s.1216@gmail.com
CORS_ORIGIN: "https://record.borui.org,https://student-records-web.vercel.app"
```

### Vercel (前端)

在 Vercel Dashboard 设置环境变量：

```bash
# API URL (生产环境)
NEXT_PUBLIC_API_URL=https://student-record-api-xxxxx-uc.a.run.app

# Firebase 配置（与本地相同）
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## 🔥 Firestore 配置

### 部署索引和规则

```bash
# 设置 Firebase 项目
firebase use borui-education-c6666

# 部署索引（包含 userId 的多租户索引）
firebase deploy --only firestore:indexes

# 部署安全规则（多租户数据隔离）
firebase deploy --only firestore:rules
```

### 检查索引状态

```bash
# 查看所有索引
firebase firestore:indexes

# 在 Firebase Console 查看
https://console.firebase.google.com/project/borui-education-c6666/firestore/indexes
```

## 📊 配置验证清单

### ✅ 本地开发环境
- [ ] `apps/api/.env` 配置完整
- [ ] `apps/web/.env.local` 配置完整
- [ ] Firebase 项目已设置: `firebase use borui-education-c6666`
- [ ] Firestore 索引已部署
- [ ] Firestore 规则已部署
- [ ] 本地服务器运行正常:
  - API: http://localhost:8080/health
  - Web: http://localhost:3000

### ✅ 生产环境配置
- [ ] Cloud Run 使用 **us-west1** region
- [ ] KMS 密钥在 **us-west1** 创建
- [ ] Firestore 在 **us-west1** region
- [ ] `env-vars.yaml` 中 `KMS_LOCATION=us-west1`
- [ ] `deploy-cloudrun.sh` 中 `REGION=us-west1`
- [ ] Vercel 环境变量已配置
- [ ] CORS 允许前端域名

### ✅ 多租户功能
- [ ] `SUPER_ADMIN_EMAIL` 已设置
- [ ] Firestore 规则包含 `userId` 验证
- [ ] 所有索引包含 `userId` 字段
- [ ] 新用户自动初始化功能正常

## 🔍 故障排查

### 问题：Firestore 索引错误
```
FAILED_PRECONDITION: The query requires an index
```

**解决方案：**
1. 运行 `firebase deploy --only firestore:indexes`
2. 等待 5-10 分钟让索引构建完成
3. 检查 Firebase Console 中的索引状态

### 问题：CORS 错误
```
Access to fetch at 'xxx' from origin 'yyy' has been blocked by CORS policy
```

**解决方案：**
1. 检查 Cloud Run 环境变量 `CORS_ORIGIN`
2. 更新部署：
```bash
gcloud run services update student-record-api \
  --region us-west1 \
  --update-env-vars CORS_ORIGIN=https://your-domain.com
```

### 问题：KMS 密钥不可用
```
Error: Cloud KMS key not found in region
```

**解决方案：**
1. 确认 KMS 密钥在 **us-west1** 创建
2. 检查环境变量 `KMS_LOCATION=us-west1`
3. 验证密钥环和密钥名称正确

### 问题：用户看到其他用户的数据
```
多租户数据隔离失效
```

**解决方案：**
1. 检查 Firestore 规则是否已部署
2. 检查所有查询是否包含 `userId` 过滤
3. 验证 `users` 集合中用户角色正确

## 📝 快速命令

```bash
# 本地开发
cd apps/api && pnpm dev          # 启动后端
cd apps/web && pnpm dev          # 启动前端

# 部署
firebase deploy --only firestore  # 部署 Firestore 配置
./deploy-cloudrun.sh             # 部署后端到 Cloud Run
./deploy-vercel.sh               # 部署前端到 Vercel

# 检查
curl http://localhost:8080/health              # 本地 API
curl https://your-api.run.app/health          # 生产 API
```

## 🔗 有用的链接

- Firebase Console: https://console.firebase.google.com/project/borui-education-c6666
- Cloud Run Console: https://console.cloud.google.com/run?project=borui-education-c6666
- Vercel Dashboard: https://vercel.com/dashboard
- Firestore Indexes: https://console.firebase.google.com/project/borui-education-c6666/firestore/indexes

