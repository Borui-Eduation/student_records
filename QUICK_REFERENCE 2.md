# 快速参考指南

**最后更新**: 2025-10-20

---

## 🚀 快速开始

### 本地开发
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev:start

# 停止开发服务器
pnpm dev:stop
```

### 代码质量检查
```bash
# 类型检查
pnpm typecheck

# Lint检查
pnpm lint

# 格式化代码
pnpm format

# 完整检查
pnpm check
```

### 部署
```bash
# 本地测试
./scripts/quick-deploy.sh  # 选项 1

# 云端部署
./scripts/quick-deploy.sh  # 选项 2

# 运行测试
./scripts/run-tests.sh
```

---

## 📁 项目结构

```
student_record/
├── apps/
│   ├── web/              # Next.js 前端 (Port 3000)
│   │   ├── src/
│   │   │   ├── app/      # 页面和路由
│   │   │   ├── components/  # React组件
│   │   │   └── lib/      # 工具函数
│   │   └── package.json
│   └── api/              # Express 后端 (Port 8080)
│       ├── src/
│       │   ├── routers/  # tRPC路由
│       │   ├── services/ # 业务逻辑
│       │   └── index.ts  # 服务器入口
│       └── package.json
├── packages/
│   └── shared/           # 共享类型和模式
│       ├── src/
│       │   ├── types/    # TypeScript接口
│       │   └── schemas/  # Zod验证模式
│       └── package.json
├── scripts/              # 自动化脚本
├── docs/                 # 文档
└── package.json          # 根package.json
```

---

## 🔗 重要链接

### 文档
- [README.md](./README.md) - 项目主文档
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 部署指南
- [DEV_GUIDE.md](./DEV_GUIDE.md) - 开发指南
- [ENV_CONFIG.md](./ENV_CONFIG.md) - 环境配置
- [AI_ASSISTANT_SETUP.md](./AI_ASSISTANT_SETUP.md) - AI助手设置
- [PROJECT_INSPECTION_REPORT.md](./PROJECT_INSPECTION_REPORT.md) - 检查报告
- [CODE_QUALITY_IMPROVEMENTS.md](./CODE_QUALITY_IMPROVEMENTS.md) - 代码质量改进
- [DOCUMENTATION_GUIDE.md](./DOCUMENTATION_GUIDE.md) - 文档整理指南

### 本地访问
- 前端: http://localhost:3000
- 后端: http://localhost:8080
- API健康检查: http://localhost:8080/health
- tRPC端点: http://localhost:8080/trpc

### 云端访问
- 前端: https://student-record.vercel.app
- 后端: https://student-record-api.run.app

---

## 🛠️ 常用命令

### 开发
```bash
# 启动所有服务
pnpm dev

# 启动前端
cd apps/web && pnpm dev

# 启动后端
cd apps/api && pnpm dev

# 构建共享包
cd packages/shared && pnpm build
```

### 测试
```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
cd apps/web && pnpm test

# 监视模式
pnpm test:watch
```

### 构建
```bash
# 构建所有包
pnpm build

# 构建前端
cd apps/web && pnpm build

# 构建后端
cd apps/api && pnpm build
```

### 清理
```bash
# 清理所有缓存
pnpm clean

# 清理node_modules
rm -rf node_modules && pnpm install
```

---

## 🔐 环境变量

### 前端 (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

### 后端 (.env)
```
PORT=8080
NODE_ENV=development
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
GEMINI_API_KEY=...
```

详见: [ENV_CONFIG.md](./ENV_CONFIG.md)

---

## 📊 API路由

### tRPC路由
- `health` - 健康检查
- `users` - 用户管理
- `clients` - 客户管理
- `rates` - 费率管理
- `sessions` - 课时记录
- `invoices` - 发票管理
- `knowledgeBase` - 知识库
- `sharingLinks` - 分享链接
- `expenses` - 支出管理
- `ai` - AI助手

### 调用示例
```typescript
// 前端
const result = await trpc.clients.list.query();

// 后端
router.query('list', async ({ ctx }) => {
  return await getClients(ctx.userId);
});
```

---

## 🎯 核心功能

### 多租户隔离
- 每个用户独立数据空间
- 基于角色的访问控制
- Firestore安全规则

### 财务管理
- 灵活的多费率系统
- 自动发票生成
- 精确的收入计算

### 课时记录
- 块编辑器
- 自动时长计算
- 笔记管理

### 知识库
- Google Cloud KMS加密
- 安全存储敏感信息
- 访问审计日志

### AI助手
- 自然语言处理
- 智能搜索和创建
- 多步操作支持

---

## 🐛 常见问题

### 端口被占用
```bash
# 解决方案
pnpm dev:stop
pnpm dev:start
```

### 依赖问题
```bash
# 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 构建失败
```bash
# 清理缓存
pnpm clean
pnpm install
pnpm build
```

### 类型错误
```bash
# 运行类型检查
pnpm typecheck

# 查看详细错误
cd apps/web && pnpm typecheck
```

---

## 📈 性能优化

### 前端
- ✅ 图片优化 (AVIF/WebP)
- ✅ 代码分割
- ✅ Gzip压缩
- ✅ 缓存策略

### 后端
- ✅ Firestore查询优化
- ✅ API速率限制
- ✅ 缓存策略
- ✅ 连接池

---

## 🔒 安全检查清单

- [ ] 环境变量已配置
- [ ] Firebase规则已部署
- [ ] KMS密钥已创建
- [ ] 管理员邮箱已配置
- [ ] HTTPS已启用
- [ ] CORS已配置
- [ ] 速率限制已启用

---

## 📞 获取帮助

### 文档
- 查看相关的.md文件
- 检查代码注释
- 查看类型定义

### 调试
- 检查浏览器控制台
- 查看服务器日志
- 使用Chrome DevTools

### 日志
```bash
# 查看Cloud Run日志
gcloud run services logs read student-record-api --region us-west1

# 查看本地日志
# 检查终端输出
```

---

## ✅ 检查清单

### 部署前
- [ ] 代码通过lint检查
- [ ] 类型检查通过
- [ ] 测试通过
- [ ] 文档已更新
- [ ] 环境变量已配置

### 部署后
- [ ] 前端可访问
- [ ] 后端可访问
- [ ] 登录功能正常
- [ ] 数据库连接正常
- [ ] 日志正常

---

**版本**: 1.0  
**状态**: ✅ 完成  
**最后更新**: 2025-10-20

