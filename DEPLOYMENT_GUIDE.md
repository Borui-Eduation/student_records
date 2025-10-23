# 学生记录系统 - 部署指南

> **快速链接**: [快速部署](#快速部署) | [手动部署](#手动部署) | [验证步骤](#验证步骤) | [故障排查](#故障排查)

---

## 🚀 快速部署

### 推荐方式：自动化脚本部署

```bash
# 1. 进入项目目录
cd /Users/yao/Documents/Organized_Files/Code_Projects/Student\ Record/student_record

# 2. 授予脚本执行权限
chmod +x scripts/quick-deploy.sh

# 3. 运行快速部署脚本
./scripts/quick-deploy.sh

# 4. 根据提示选择部署类型：
#    选项 1: 本地测试（快速，适合开发）
#    选项 2: 完整云端部署（需要 GCP + Vercel）
```

---

## 📋 部署前检查清单

在部署前，请确保以下条件满足：

### 环境要求
- ✅ Node.js ≥ 20.0.0
  ```bash
  node --version
  ```
- ✅ pnpm ≥ 8.0.0
  ```bash
  pnpm --version
  ```
- ✅ Docker (用于Cloud Run部署)
  ```bash
  docker --version
  ```
- ✅ gcloud CLI (用于Google Cloud)
  ```bash
  gcloud --version
  ```

### 配置文件检查
- ✅ `apps/api/.env` 或环境变量已配置
- ✅ `apps/web/.env.local` 或 Vercel环境变量已配置
- ✅ Firebase配置正确 (查看 `ENV_CONFIG.md`)
- ✅ Google Cloud项目已创建

### 密钥和凭证
- ✅ Google Cloud 服务账号 JSON 密钥
- ✅ Vercel 部署 Token (如部署到Vercel)
- ✅ Gemini API Key 已配置

---

## 🌐 部署方案对比

| 方案 | 前端 | 后端 | 成本 | 时间 | 推荐 |
|-----|------|------|------|------|------|
| **本地开发** | localhost:3000 | localhost:8080 | 免费 | 5分钟 | ✅ 开发 |
| **Vercel + Cloud Run** | Vercel CDN | Cloud Run | 免费 | 30分钟 | ✅ 生产 |
| **Docker + 自建服务器** | Nginx | Docker | $$$ | 1小时+ | ❌ 昂贵 |

**推荐方案**: Vercel (前端) + Cloud Run (后端) = 完全免费

---

## 🎯 分步骤部署指南

### 步骤1: 本地准备

```bash
# 1.1 克隆或进入项目
cd /Users/yao/Documents/Organized_Files/Code_Projects/Student\ Record/student_record

# 1.2 安装依赖
pnpm install

# 1.3 构建共享包
cd packages/shared
pnpm build
cd ../..

# 1.4 类型检查
pnpm typecheck

# 1.5 代码质量检查
pnpm lint
pnpm format:check
```

### 步骤2: 本地测试（可选但推荐）

```bash
# 2.1 启动本地开发服务器
pnpm dev:start

# 2.2 访问并验证
# 前端: http://localhost:3000
# 后端: http://localhost:8080
# 健康检查: curl http://localhost:8080/health

# 2.3 停止服务
pnpm dev:stop
```

### 步骤3: 部署到Google Cloud Run (后端)

#### 选项 A: 使用脚本自动部署 ⭐ 推荐

```bash
# 3A.1 运行部署脚本
chmod +x deploy-cloudrun.sh
./deploy-cloudrun.sh

# 脚本会自动：
# ✅ 验证gcloud和pnpm已安装
# ✅ 构建TypeScript代码
# ✅ 启用必要的Google Cloud API
# ✅ 构建Docker镜像
# ✅ 部署到Cloud Run
# ✅ 运行健康检查
# ✅ 显示API URL

# 3A.2 记下输出的 API URL
# 例如: https://student-record-api-xxxxx.a.run.app
```

#### 选项 B: 手动部署

```bash
# 3B.1 设置 Google Cloud 项目
gcloud config set project borui-education-c6666

# 3B.2 启用 API
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# 3B.3 使用 Cloud Build 部署
gcloud run deploy student-record-api \
  --source . \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 2

# 3B.4 获取服务URL
gcloud run services describe student-record-api \
  --region us-west1 \
  --format 'value(status.url)'
```

### 步骤4: 部署到 Vercel (前端)

#### 选项 A: 通过 Vercel CLI ⭐ 推荐

```bash
# 4A.1 安装 Vercel CLI
npm i -g vercel

# 4A.2 登录 Vercel
vercel login

# 4A.3 部署到生产环境
vercel --prod

# 4A.4 按提示输入信息：
# - Link to existing project? No
# - Project name: student-record-web
# - Root directory: apps/web
# - Build Command: cd ../.. && pnpm install && pnpm build --filter=web

# 4A.5 添加环境变量 (在 Vercel 控制台)
# NEXT_PUBLIC_API_URL=https://student-record-api-xxxxx.a.run.app
# NEXT_PUBLIC_ENV=production
```

#### 选项 B: 通过 Vercel 网页界面

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 选择你的 GitHub 仓库
4. 配置项目设置：
   - **Framework**: Next.js
   - **Root Directory**: apps/web
   - **Build Command**: `cd ../.. && pnpm install && pnpm build --filter=web`
5. 添加环境变量 (见上文)
6. 点击 "Deploy"

### 步骤5: 配置 CORS (连接前后端)

```bash
# 5.1 部署后，更新 Cloud Run 的 CORS 配置
# 替换 YOUR_VERCEL_URL 为你的 Vercel 应用 URL

gcloud run services update student-record-api \
  --region us-west1 \
  --update-env-vars CORS_ORIGIN=https://YOUR_VERCEL_URL.vercel.app
```

---

## ✅ 验证步骤

部署完成后，验证一切正常工作：

### 1️⃣ 验证前端

```bash
# 访问前端应用
curl https://YOUR_VERCEL_URL.vercel.app

# 应该返回 HTML 内容 (Next.js 应用)
# 检查项：
# ✅ 页面加载正常
# ✅ CSS 样式生效
# ✅ 没有 404 错误
```

### 2️⃣ 验证后端

```bash
# 测试健康检查
curl https://student-record-api-xxxxx.a.run.app/health

# 应该返回:
# {"status":"ok","message":"API is running"}

# 查看日志
gcloud run services logs read student-record-api --region us-west1 --limit 50
```

### 3️⃣ 验证 Firebase 连接

```bash
# 在 Firebase 控制台检查：
# 1. Firestore: 有数据写入
# 2. Authentication: 能进行用户认证
# 3. Storage: 文件上传正常

# 或通过 API 测试 (需要身份验证)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://student-record-api-xxxxx.a.run.app/trpc/clients.list
```

### 4️⃣ 验证缓存系统

```bash
# 查看 API 日志中是否有缓存命中
gcloud run services logs read student-record-api --region us-west1 | grep "Cache HIT"

# 预期输出: 第二次请求相同数据时会显示 "Cache HIT"
```

### 5️⃣ 验证 Gemini API

```bash
# 测试 AI 功能 (通过前端或 API)
# 快速请求应该通过速率限制器
# 日志应该显示: "Request queued" 或 "Executing queued request"
```

### 验证检查清单

```
部署验证清单:

前端 (Vercel):
  ☐ 可以访问应用首页
  ☐ 页面加载速度正常 (< 3秒)
  ☐ 没有控制台错误
  ☐ 样式和图片正确显示

后端 (Cloud Run):
  ☐ 健康检查通过 (curl /health)
  ☐ API 日志没有错误
  ☐ 内存使用 < 512Mi
  ☐ CPU 利用率合理

数据库 (Firestore):
  ☐ 有新文档写入
  ☐ 查询速度 < 1秒
  ☐ 没有安全规则拒绝

AI 功能 (Gemini):
  ☐ 能发送查询
  ☐ 速率限制生效
  ☐ 响应速度 < 5秒

缓存系统:
  ☐ 内存缓存命中率 > 50%
  ☐ Firestore 读取减少 > 70%
  ☐ 响应时间 < 50ms
```

---

## 🔧 常见配置

### 环境变量配置示例

**后端 (Cloud Run) 环境变量:**
```
NODE_ENV=production
GOOGLE_CLOUD_PROJECT=borui-education-c6666
FIREBASE_PROJECT_ID=borui-education-c6666
CORS_ORIGIN=https://your-app.vercel.app
ADMIN_EMAILS=your-email@gmail.com
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
LOG_LEVEL=info
```

**前端 (Vercel) 环境变量:**
```
NEXT_PUBLIC_API_URL=https://student-record-api-xxxxx.a.run.app
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

---

## 📊 监控部署

### 查看实时日志

```bash
# 后端日志 (实时)
gcloud run services logs tail student-record-api --region us-west1

# 后端日志 (最近50条)
gcloud run services logs read student-record-api --region us-west1 --limit 50

# 前端日志 (Vercel 控制台)
# 访问 https://vercel.com 查看
```

### 监控成本

```bash
# 查看 Cloud Run 使用情况
gcloud run services describe student-record-api --region us-west1

# 查看 Firestore 使用情况
# Firebase 控制台 → Firestore → 使用情况

# 查看存储使用
gsutil du -s gs://borui-education-c6666
```

### 性能指标

```bash
# API 响应时间
gcloud run services logs read student-record-api | grep "durationMs"

# 缓存命中率
gcloud run services logs read student-record-api | grep -c "Cache HIT"
```

---

## ❌ 故障排查

### 问题1: 部署脚本权限错误

**错误**: `Permission denied`

**解决**:
```bash
chmod +x deploy-cloudrun.sh
chmod +x scripts/quick-deploy.sh
./deploy-cloudrun.sh
```

### 问题2: gcloud 未找到

**错误**: `command not found: gcloud`

**解决**:
```bash
# 安装 Google Cloud SDK
# macOS:
brew install --cask google-cloud-sdk

# 初始化
gcloud init
gcloud auth login
```

### 问题3: Docker 构建失败

**错误**: `docker: command not found` 或构建超时

**解决**:
```bash
# 确保 Docker 正在运行
docker ps

# 如果失败，重启 Docker Desktop
# macOS: 菜单栏 → Docker 图标 → Restart

# 清空 Docker 缓存重新构建
docker system prune
./deploy-cloudrun.sh
```

### 问题4: 健康检查失败

**错误**: `API 健康检查返回状态码 502/503`

**解决**:
```bash
# 等待服务完全启动 (可能需要 1-2 分钟)
sleep 60

# 再次测试
curl https://student-record-api-xxxxx.a.run.app/health

# 查看日志查找原因
gcloud run services logs read student-record-api --region us-west1 --limit 20
```

### 问题5: 前后端连接失败

**错误**: 前端无法连接后端 API

**解决**:
```bash
# 1. 检查 API URL 是否正确
echo $NEXT_PUBLIC_API_URL

# 2. 检查 CORS 配置
gcloud run services describe student-record-api --region us-west1 | grep CORS_ORIGIN

# 3. 更新 CORS
gcloud run services update student-record-api \
  --region us-west1 \
  --update-env-vars CORS_ORIGIN=https://your-vercel-app.vercel.app

# 4. 重新部署前端
vercel --prod
```

### 问题6: Firestore 权限错误

**错误**: `Permission denied on resource`

**解决**:
```bash
# 检查服务账号权限
gcloud projects get-iam-policy borui-education-c6666 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:student-record-api*"

# 添加必要的权限
gcloud projects add-iam-policy-binding borui-education-c6666 \
  --member="serviceAccount:student-record-api@borui-education-c6666.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

### 问题7: 缓存命中率低

**错误**: 缓存命中率 < 30%

**解决**:
```bash
# 查看缓存日志
gcloud run services logs read student-record-api --region us-west1 | grep "Cache"

# 查看是否有 N+1 查询
gcloud run services logs read student-record-api --region us-west1 | grep "query"

# 检查 TTL 设置 (apps/api/src/services/cache.ts)
# 可能需要增加 memoryTtl 或 firestoreTtl
```

### 问题8: 速率限制错误 (429)

**错误**: Gemini API 返回 429 Too Many Requests

**解决**:
```bash
# 检查速率限制器日志
gcloud run services logs read student-record-api --region us-west1 | grep "Rate limit"

# 检查队列大小
gcloud run services logs read student-record-api --region us-west1 | grep "queue"

# 如果频繁出现，可以调整优先级
# 或降低请求频率
```

---

## 🎯 后续步骤

### 第一天（部署后）
- [ ] 验证所有功能工作正常
- [ ] 检查日志没有错误
- [ ] 测试用户登录和数据操作
- [ ] 验证缓存和性能

### 第一周
- [ ] 监控成本是否在预期范围内
- [ ] 收集用户反馈
- [ ] 进行性能基准测试
- [ ] 更新 DNS 记录 (如有自定义域名)

### 长期
- [ ] 建立监控告警
- [ ] 定期检查日志
- [ ] 更新依赖和安全补丁
- [ ] 优化性能和成本

---

## 📞 获取帮助

**查看详细文档**:
- `FREE_TIER_OPTIMIZATION.md` - 免费额度详解
- `ENV_CONFIG.md` - 环境变量配置
- `OPTIMIZATION_SUMMARY_2025.md` - 优化总结

**常见问题链接**:
- [Google Cloud Run 文档](https://cloud.google.com/run/docs)
- [Vercel 文档](https://vercel.com/docs)
- [Firebase 文档](https://firebase.google.com/docs)

**查看日志**:
```bash
# 后端日志
gcloud run services logs read student-record-api --region us-west1 --limit 100

# 前端日志 (Vercel)
# https://vercel.com/dashboard → 项目 → Deployments → Logs
```

---

**部署状态**: ✅ 准备就绪  
**预期部署时间**: 30-45分钟  
**预期月度成本**: $0 (完全免费)
