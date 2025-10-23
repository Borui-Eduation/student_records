# Professional Workspace
# 专业工作空间

> 🎉 **项目状态: 生产就绪**

一体化多业务后台管理平台，支持教育与技术服务管理，具备财务自动化、课时记录、费用管理和知识库功能。

---

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 构建共享包
cd packages/shared && pnpm build && cd ../..

# 3. 启动开发服务器（自动处理端口冲突）
pnpm dev:start

# 4. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:8080

# 5. 停止服务
pnpm dev:stop
```

### 生产部署

```bash
# 一键部署到 Google Cloud Run + Vercel
./scripts/quick-deploy.sh
```

---

## ✨ 核心功能

### 👥 用户管理
- **角色系统**: user / admin / superadmin 三级权限
- **新用户审查**: superadmin 可审查和管理新注册用户
- **数据隔离**: 每个用户独立的数据空间
- **Google 登录**: Firebase Authentication 集成

### 💰 费用管理 (Expenses)
- **多币种支持**: CNY, USD, CAD 等
- **分类管理**: 餐饮、交通、购物、教育等
- **图片上传**: 支持收据照片（自动压缩和缩略图）
- **统计报表**: 按月/周/日查看费用趋势
- **客户关联**: 费用可关联到特定客户

### 📝 课时记录 (Sessions)
- **富文本编辑**: 块编辑器支持结构化内容
- **自动计费**: 根据费率自动计算金额
- **时长追踪**: 精确记录课时时长
- **客户关联**: 关联客户和服务类型

### 🧾 发票管理 (Invoices)
- **自动生成**: 基于课时记录自动创建发票
- **状态追踪**: 未开票/已开票/已支付
- **编号系统**: INV-001 格式自动编号
- **收入统计**: 实时收入分析

### 🔐 知识库 (Knowledge Base)
- **加密存储**: Google Cloud KMS AES-256-GCM 加密
- **分类管理**: API Keys, SSH, Passwords, Notes
- **安全访问**: 仅授权用户可访问
- **审计日志**: 记录所有访问操作

### 📊 Dashboard
- **实时统计**: 客户、课时、发票、费用概览
- **收入分析**: 月度收入趋势图表
- **最近活动**: 最新的课时和费用记录
- **快速操作**: 一键创建新记录

### 📱 PWA 支持
- **离线访问**: Service Worker 缓存
- **安装到桌面**: iOS/Android 支持
- **响应式设计**: 完美适配移动端

---

## 🏗️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | Next.js 14 + React 19 + TypeScript | App Router, Server Components |
| **UI** | Tailwind CSS + shadcn/ui | 响应式设计，暗色主题 |
| **API** | tRPC | 端到端类型安全 |
| **后端** | Express + TypeScript | RESTful + tRPC |
| **数据库** | Firebase Firestore | NoSQL, 实时同步 |
| **存储** | Firebase Storage | 图片和文件存储 |
| **认证** | Firebase Auth | Google OAuth |
| **加密** | Google Cloud KMS | AES-256-GCM |
| **部署** | Vercel + Cloud Run | Serverless, 自动扩展 |
| **包管理** | pnpm + Turborepo | Monorepo 架构 |

---

## 📁 项目结构

```
student_record/
├── apps/
│   ├── web/                    # Next.js 前端 (Port 3000)
│   │   ├── src/app/            # 页面路由
│   │   │   ├── dashboard/      # Dashboard 页面
│   │   │   ├── expenses/       # 费用管理
│   │   │   ├── sessions/       # 课时记录
│   │   │   └── invoices/       # 发票管理
│   │   └── src/components/     # React 组件
│   └── api/                    # Express 后端 (Port 8080)
│       ├── src/routers/        # tRPC 路由
│       │   ├── users.ts        # 用户管理
│       │   ├── expenses.ts     # 费用 API
│       │   ├── sessions.ts     # 课时 API
│       │   └── invoices.ts     # 发票 API
│       └── src/services/       # 业务逻辑
├── packages/shared/            # 共享类型和 Schema
├── scripts/                    # 工具脚本
│   ├── quick-deploy.sh         # 一键部署
│   ├── set-superadmin.js       # 设置管理员
│   ├── check-expenses.js       # 检查费用数据
│   └── fix-broken-timestamps.js # 修复时间戳
└── README.md
```

---

## 🛠️ 常用命令

### 开发

```bash
# 启动开发服务器（自动处理端口冲突）
pnpm dev:start

# 停止开发服务器
pnpm dev:stop

# 传统方式启动（可能遇到端口冲突）
pnpm dev

# 类型检查
pnpm typecheck

# 代码格式化
pnpm format
```

### 用户管理

```bash
# 设置用户为 superadmin
node scripts/set-superadmin.js user@example.com superadmin

# 设置用户为 admin
node scripts/set-superadmin.js user@example.com admin

# 检查用户角色
node scripts/check-user-role.js user@example.com
```

### 数据管理

```bash
# 检查费用记录
node scripts/check-expenses.js user@example.com

# 修复损坏的时间戳
node scripts/fix-broken-timestamps.js

# 检查费用详情
node scripts/check-expense-detail.js <expenseId>
```

### 部署

```bash
# 一键部署
./scripts/quick-deploy.sh

# 部署 Firestore 规则和索引
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# 查看 Cloud Run 日志
gcloud run services logs tail student-record-api --region us-west1
```

---

## 🔒 环境配置

### 必需的环境变量

**后端 (apps/api/.env)**
```bash
# Firebase
GOOGLE_CLOUD_PROJECT=your-project-id
FIREBASE_PROJECT_ID=your-project-id

# 管理员邮箱（逗号分隔）
ADMIN_EMAILS=admin@example.com

# Gemini API (可选)
GEMINI_API_KEY=your-gemini-api-key

# CORS
CORS_ORIGIN=http://localhost:3000
```

**前端 (apps/web/.env.local)**
```bash
# API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# Firebase 配置
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## 🔧 常见问题

### 1. 端口被占用
**错误**: `EADDRINUSE: address already in use :::8080`

**解决**:
```bash
pnpm dev:stop
pnpm dev:start
```

### 2. Expense 不显示
**原因**: 日期字段损坏或权限问题

**解决**:
```bash
# 检查用户角色
node scripts/check-user-role.js your@email.com

# 修复时间戳
node scripts/fix-broken-timestamps.js

# 检查数据
node scripts/check-expenses.js your@email.com
```

### 3. 新用户无法访问
**原因**: 新用户默认角色为 'user'

**解决**:
```bash
# 升级为 admin
node scripts/set-superadmin.js user@email.com admin
```

### 4. 图片上传失败
**原因**: Firebase Storage 权限或配置问题

**解决**:
- 检查 Firebase Storage 规则
- 确认 Storage Bucket 配置正确
- 查看浏览器控制台错误信息

---

## 💰 成本估算

### 免费额度
- **Vercel**: 免费（Hobby 计划）
- **Cloud Run**: 2M 请求/月
- **Firestore**: 50K 读取/天
- **Firebase Auth**: 无限用户
- **Firebase Storage**: 5GB

**预计成本**: $0-5/月（正常使用）

---

## 📚 重要更新日志

### 2025-10-23: Expense 功能修复
- ✅ 修复日期解析问题（支持 ISO 格式）
- ✅ 修复 Firestore Timestamp 损坏问题
- ✅ 添加数据修复脚本
- ✅ 优化 `cleanUndefinedValues` 函数

### 2025-10-20: 新用户管理功能
- ✅ 新用户自动标记 `isNewUser: true`
- ✅ Superadmin 可审查新用户
- ✅ 添加 `/dashboard/new-users` 页面
- ✅ Sidebar 显示待审查用户数量

### 2025-10-12: 系统优化
- ✅ TypeScript 严格模式
- ✅ 性能优化（FCP 提升 40%）
- ✅ 安全加固（KMS 加密）
- ✅ PWA 支持

---

## 🔗 相关链接

- **生产环境**: https://record.borui.org
- **GitHub**: https://github.com/Borui-Eduation/student_records
- **Firebase Console**: https://console.firebase.google.com
- **Google Cloud**: https://console.cloud.google.com

---

## 📖 文档索引

核心文档已整合到本 README，其他参考文档：

- `DEV_GUIDE.md` - 开发指南
- `DEPLOYMENT_GUIDE.md` - 部署指南
- `ENV_CONFIG.md` - 环境配置详解
- `NEW_USERS_FEATURE_IMPLEMENTATION.md` - 新用户功能文档
- `PWA_GUIDE.md` - PWA 实现指南

---

## 🎯 快速参考

### 访问 URL
- 前端: http://localhost:3000
- 后端: http://localhost:8080
- 健康检查: http://localhost:8080/health

### 默认角色
- **user**: 基础用户（受限访问）
- **admin**: 管理员（完整功能）
- **superadmin**: 超级管理员（用户管理）

### 重要区域
- 所有服务使用 **us-west1** region
- Firebase Storage: **us-west1**
- Cloud Run: **us-west1**

---

**版本**: 1.2.0
**状态**: ✅ 生产就绪
**最后更新**: 2025-10-23

---

**Made with ❤️ for Professional Workspace Management**

