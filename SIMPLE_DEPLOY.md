# 🚀 简化云端部署指南

使用您现有的 Firebase 和 Google Cloud 资源。

---

## 📋 前置确认

- ✅ Firebase 项目: `borui-education-c6666`
- ✅ Google Cloud 项目: `borui-education-c6666`
- ✅ 管理员邮箱: `yao.s.1216@gmail.com`
- ✅ 本地环境正常运行

---

## 🔧 步骤 1：部署后端到 Cloud Run

### 1.1 检查后端 Dockerfile

确保 `apps/api/Dockerfile` 存在且正确。

### 1.2 部署到 Cloud Run（自动构建）

```bash
cd apps/api

# Cloud Run 会自动从源代码构建，无需本地 Docker！
gcloud run deploy student-record-api \
  --source . \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --project borui-education-c6666 \
  --service-account student-record-api@borui-education-c6666.iam.gserviceaccount.com \
  --set-env-vars "NODE_ENV=production,GOOGLE_CLOUD_PROJECT=borui-education-c6666,FIREBASE_PROJECT_ID=borui-education-c6666,GCS_BUCKET_NAME=borui-education-c6666-storage,KMS_KEY_RING=student-record-keyring,KMS_KEY_NAME=knowledge-base-key,KMS_LOCATION=asia-east1,ADMIN_EMAILS=yao.s.1216@gmail.com" \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 60s
```

**预计时间**: 5-10 分钟（Cloud Build 自动构建和部署）

### 1.3 获取 API URL

部署完成后，Cloud Run 会显示 URL：
```
https://student-record-api-xxx-xx.a.run.app
```

**请记录这个 URL！** 前端需要用到。

### 1.4 测试后端

```bash
# 替换为您的实际 URL
curl https://student-record-api-xxx-xx.a.run.app/health
```

应该返回：`{"status":"ok"}`

---

## 🌐 步骤 2：部署前端到 Vercel

### 2.1 推送代码到 GitHub（如果还没有）

```bash
cd /Users/yao/Documents/Organized_Files/Code_Projects/Student\ Record/student_record

# 初始化 git（如果还没有）
git init
git add -A
git commit -m "Deploy to production"

# 创建 GitHub 仓库后推送
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2.2 配置 Vercel

1. 访问 https://vercel.com/dashboard
2. 点击 "Add New" → "Project"
3. Import 您的 GitHub 仓库
4. 配置项目：

**项目设置**：
- Framework Preset: `Next.js`
- Root Directory: `apps/web`
- Build Command: 
  ```
  cd ../.. && pnpm install && pnpm build --filter=web
  ```
- Output Directory: `apps/web/.next`
- Install Command: `pnpm install`

### 2.3 配置环境变量

在 Vercel 项目设置 → Environment Variables 中添加：

```bash
# API URL（使用步骤 1.3 的 URL）
NEXT_PUBLIC_API_URL=https://student-record-api-xxx-xx.a.run.app

# 环境
NEXT_PUBLIC_ENV=production

# Firebase 配置（使用现有配置）
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAX5jhVczQ9dvHig3_h6fyRQHSRzub8olU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=borui-education-c6666.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=borui-education-c6666
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=borui-education-c6666.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=629935238761
NEXT_PUBLIC_FIREBASE_APP_ID=1:629935238761:web:8877023b2a2195a6aefcf8
```

**重要**: 为 Production、Preview 和 Development 三个环境都添加。

### 2.4 部署

点击 "Deploy" 按钮。

**预计时间**: 3-5 分钟

---

## 🔗 步骤 3：更新配置

### 3.1 更新 Cloud Run CORS

部署完成后，Vercel 会给您一个 URL（如 `https://your-app.vercel.app`）

更新后端 CORS 配置：

```bash
gcloud run services update student-record-api \
  --region asia-east1 \
  --project borui-education-c6666 \
  --update-env-vars CORS_ORIGIN=https://your-app.vercel.app
```

### 3.2 配置 Firebase Authentication

1. 访问 Firebase Console: https://console.firebase.google.com
2. 选择项目 `borui-education-c6666`
3. 进入 Authentication → Settings → Authorized domains
4. 添加您的 Vercel 域名：`your-app.vercel.app`

---

## ✅ 步骤 4：测试

1. 访问您的 Vercel URL
2. 尝试登录（使用您的 Google 账号或已注册的邮箱）
3. 测试核心功能：
   - 创建客户
   - 添加费率
   - 记录会话
   - 生成发票
   - 知识库加密

---

## 🎉 完成！

您的系统已成功部署到云端！

**前端**: https://your-app.vercel.app  
**后端**: https://student-record-api-xxx-xx.a.run.app

**成本**: $0/月（在免费额度内）

---

## 🆘 故障排查

### 问题 1：Cloud Run 部署失败

查看日志：
```bash
gcloud run services logs tail student-record-api \
  --region asia-east1 \
  --project borui-education-c6666
```

常见原因：
- 服务账号权限不足
- KMS 密钥配置错误
- 环境变量缺失

### 问题 2：Vercel 构建失败

- 检查 Build Command 是否正确
- 确认 Root Directory 设置为 `apps/web`
- 查看 Vercel 构建日志

### 问题 3：无法登录

- 确认 Firebase Authorized domains 已添加
- 检查 CORS 配置
- 确认环境变量正确

---

## 📊 监控

### Cloud Run 监控

```bash
# 查看实时日志
gcloud run services logs tail student-record-api \
  --region asia-east1 \
  --project borui-education-c6666

# 查看服务详情
gcloud run services describe student-record-api \
  --region asia-east1 \
  --project borui-education-c6666
```

### Vercel 监控

访问 Vercel Dashboard → 您的项目 → Analytics

---

## 🔄 更新部署

### 更新后端

```bash
cd apps/api
gcloud run deploy student-record-api \
  --source . \
  --region asia-east1 \
  --project borui-education-c6666
```

### 更新前端

推送代码到 GitHub，Vercel 会自动部署：
```bash
git add -A
git commit -m "Update features"
git push
```

---

**祝部署顺利！** 🚀

