# 快速开始指南 🚀

3 种方式部署和测试您的学生记录管理系统。

---

## 方式 1️⃣: 本地快速测试（推荐新手，5分钟）

无需 Google Cloud，快速验证系统功能。

```bash
# 1. 安装依赖
pnpm install

# 2. 构建共享包
cd packages/shared && pnpm build && cd ../..

# 3. 配置环境变量（会自动引导）
./scripts/quick-deploy.sh
# 选择选项 1：本地测试

# 4. 启动服务器
pnpm dev

# 5. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:8080/health
```

**限制**: 没有真实的数据库和认证，但可以验证界面和基本逻辑。

---

## 方式 2️⃣: 一键云端部署（推荐，30分钟）

使用自动化脚本部署到 Google Cloud + Vercel。

### 前置要求

```bash
# 确认已安装（脚本会自动检查）
node --version   # >= 20.0.0
pnpm --version   # >= 8.0.0
gcloud --version # 最新版本
docker --version # 最新版本
```

### 部署步骤

```bash
# 登录 Google Cloud
gcloud auth login

# 运行自动部署脚本
./scripts/quick-deploy.sh

# 按提示操作：
# 1. 选择选项 2：云端部署
# 2. 输入项目信息：
#    - 项目 ID: student-record-demo-2024
#    - 区域: asia-east1
#    - 管理员邮箱: your-email@gmail.com
# 3. 选择 y：创建 Google Cloud 资源
# 4. 等待部署完成（约10-15分钟）
```

**脚本会自动完成**:
- ✅ 创建 GCP 项目资源（Firestore, Cloud Storage, KMS）
- ✅ 构建并部署后端到 Cloud Run
- ✅ 测试 API 连接
- ✅ 提供 Vercel 部署指引

### 部署前端到 Vercel

脚本完成后，按照终端提示：

1. **推送代码到 GitHub** (如果还没有)
   ```bash
   git remote add origin https://github.com/your-username/student-record.git
   git push -u origin main
   ```

2. **在 Vercel 导入项目**
   - 访问: https://vercel.com/dashboard
   - 点击 "Add New" → "Project"
   - Import 您的 GitHub 仓库

3. **配置构建设置**
   ```
   Framework: Next.js
   Root Directory: apps/web
   Build Command: cd ../.. && pnpm install && pnpm build --filter=web
   Output Directory: apps/web/.next
   Install Command: pnpm install
   ```

4. **添加环境变量**
   - 复制脚本输出的 API URL
   - 在 Vercel 添加环境变量（见下方）

5. **部署**
   - 点击 "Deploy"
   - 等待 2-3 分钟

### Vercel 环境变量

```env
# API 配置
NEXT_PUBLIC_API_URL=https://student-record-api-xxxxx-uc.a.run.app
NEXT_PUBLIC_ENV=production

# Firebase 配置（从 Firebase Console 获取）
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=student-record-demo-2024.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=student-record-demo-2024
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=student-record-demo-2024.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**获取 Firebase 配置**:
1. 访问: https://console.firebase.google.com/
2. 添加/选择项目: `student-record-demo-2024`
3. Authentication → Sign-in method → 启用 Google 和 Email/Password
4. Project Settings → General → Your apps → 添加 Web 应用
5. 复制 `firebaseConfig` 的值

### 最后一步：更新 CORS

```bash
# 用您的 Vercel URL 替换
VERCEL_URL="https://your-app.vercel.app"

# 更新 Cloud Run CORS 配置
gcloud run services update student-record-api \
  --region asia-east1 \
  --update-env-vars "CORS_ORIGIN=$VERCEL_URL"
```

**完成！🎉** 访问您的 Vercel URL 开始使用。

---

## 方式 3️⃣: 手动分步部署（完全控制，45分钟）

适合需要完全理解每个步骤的用户。

### 详细文档

查看完整的分步指南：

- **Google Cloud 设置**: `docs/GOOGLE_CLOUD_SETUP.md`
- **部署指南**: `docs/DEPLOYMENT.md`  
- **部署和测试**: `docs/DEPLOY_AND_TEST.md`

### 手动步骤概览

1. **Google Cloud 设置** (15分钟)
   - 创建 GCP 项目
   - 启用 API
   - 创建 Firestore 数据库
   - 创建 Cloud Storage 存储桶
   - 配置 Cloud KMS
   - 创建服务账号

2. **Firebase 设置** (5分钟)
   - 链接 Firebase 项目
   - 启用 Authentication
   - 获取 Firebase 配置

3. **后端部署** (10分钟)
   - 构建 Docker 镜像
   - 推送到 GCR
   - 部署到 Cloud Run

4. **前端部署** (10分钟)
   - 推送代码到 GitHub
   - Vercel 导入项目
   - 配置环境变量
   - 部署

5. **测试** (5分钟)
   - 运行自动化测试
   - 手动功能测试

---

## 🧪 测试部署

无论使用哪种方式部署，都应该进行测试。

### 自动化测试

```bash
# 测试本地环境
./scripts/run-tests.sh
# 选择选项 1

# 测试生产环境
./scripts/run-tests.sh
# 选择选项 2
# 输入您的 API 和前端 URL
```

### 手动测试

跟随详细测试清单：

```bash
# 打开测试清单
open docs/TEST_CHECKLIST.md
```

**核心测试** (2分钟快速验证):
1. ✅ 前端可访问
2. ✅ 可以登录
3. ✅ Dashboard 加载
4. ✅ 创建一个客户
5. ✅ 记录一个会话
6. ✅ 生成一张发票
7. ✅ 创建一个加密知识库条目
8. ✅ 创建一个分享链接

---

## 📚 完整文档索引

| 文档 | 说明 | 耗时 |
|------|------|------|
| `QUICKSTART_CN.md` | 本文档 | 5-45分钟 |
| `docs/DEPLOY_AND_TEST.md` | 详细部署和测试指南 | 30-45分钟 |
| `docs/GOOGLE_CLOUD_SETUP.md` | Google Cloud 手动设置 | 15-20分钟 |
| `docs/DEPLOYMENT.md` | 完整部署流程 | 30-45分钟 |
| `docs/TEST_CHECKLIST.md` | 功能测试清单 | 10-30分钟 |
| `GETTING_STARTED.md` | 本地开发指南 | 5分钟 |

---

## 🆘 遇到问题？

### 常见错误

**1. 无法登录**
```bash
# 检查 Firebase Console → Authentication → Authorized domains
# 确认您的域名在列表中
```

**2. API 连接失败**
```bash
# 检查 API 健康
curl https://your-api-url.run.app/health

# 检查 CORS 配置
# Vercel → Settings → Environment Variables
# 确认 NEXT_PUBLIC_API_URL 正确
```

**3. 加密功能不工作**
```bash
# 检查 KMS 配置
gcloud kms keys list --keyring=student-record-keyring --location=global

# 检查服务账号权限
gcloud projects get-iam-policy student-record-demo-2024 \
  --flatten="bindings[].members" \
  --filter="bindings.members:student-record-api@"
```

### 查看日志

```bash
# Cloud Run 日志
gcloud run services logs tail student-record-api --region asia-east1

# Vercel 日志
# Dashboard → Deployments → 选择部署 → View Logs
```

### 获取帮助

1. 查看 `docs/DEPLOY_AND_TEST.md` 的"常见问题排查"章节
2. 查看 Cloud Run 和 Vercel 日志
3. 检查环境变量配置
4. 确认服务账号权限

---

## 💰 成本估算

### 免费额度（前3个月）

- **Vercel**: $0 (Hobby 计划)
- **Cloud Run**: $0 (每月 2M 请求)
- **Firestore**: $0 (每天 50K 读取)
- **Cloud Storage**: $0 (5GB 存储)
- **Cloud KMS**: $0 (20K 加密操作)
- **Firebase Auth**: $0 (无限用户)

**总计: $0/月**

### 超出免费额度

预计 $10-15/月（正常使用）

---

## 🎯 推荐流程

### 对于新手

1. ✅ **先本地测试** (方式 1) - 5分钟
   - 熟悉界面和功能
   
2. ✅ **再云端部署** (方式 2) - 30分钟
   - 使用自动化脚本
   
3. ✅ **完整测试** - 15分钟
   - 运行测试脚本
   - 手动测试核心功能

**总计: 约 50 分钟完成生产部署**

### 对于有经验的开发者

直接使用 **方式 2**（一键部署）或 **方式 3**（手动部署）

---

## 📞 支持

- 📖 完整文档: `docs/` 文件夹
- 🔧 脚本帮助: `./scripts/quick-deploy.sh --help`
- 🐛 问题排查: `docs/DEPLOY_AND_TEST.md` 的故障排除章节
- 📝 项目规格: `specs/001-/spec.md`

---

**祝您部署顺利！🎉**

部署成功后，您将拥有：
- ✅ 完整的客户管理系统
- ✅ 自动化财务开票
- ✅ 富媒体课时记录
- ✅ 加密知识库
- ✅ 会话分享功能
- ✅ 收入分析报表

**开始使用您的专业管理平台吧！**


