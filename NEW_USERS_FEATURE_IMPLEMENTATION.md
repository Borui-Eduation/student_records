# 新用户管理功能实现总结

## 📋 功能概述

为 superadmin 添加了完整的新用户管理系统，包括：

1. **新用户自动标记** - 新注册用户自动设置 `isNewUser: true`
2. **新用户管理页面** - 专门的页面用于审查和管理新用户
3. **Sidebar 菜单** - 为 superadmin 添加 "New Users" 菜单项
4. **用户升级功能** - 在审查时可以更改新用户的角色
5. **审查标记** - 标记用户为已审查并从列表中移除
6. **提示通知** - 用户管理页面显示待审查新用户的数量

---

## 🔧 技术实现

### 后端更改 (apps/api/src/routers/users.ts)

#### 1. 新用户标记字段
```typescript
const newUser = {
  email: ctx.user.email || '',
  role,
  createdAt: admin.firestore.Timestamp.now(),
  lastLoginAt: admin.firestore.Timestamp.now(),
  isInitialized: false,
  isNewUser: true, // 新增：标记为新用户
};
```

#### 2. 新增 API 方法

**listNewUsers** - 获取所有待审查的新用户
- 权限：superadmin only
- 返回：新用户列表和总数
- 查询：`where('isNewUser', '==', true)`

**getNewUsersCount** - 获取新用户计数
- 权限：superadmin only
- 返回：新用户数量
- 用途：在用户管理页面显示提示

**markUserAsReviewed** - 标记用户为已审查
- 权限：superadmin only
- 参数：userId
- 操作：设置 `isNewUser: false`，记录 `reviewedAt` 和 `reviewedBy`

### 前端更改

#### 1. Sidebar 菜单 (apps/web/src/components/layout/Sidebar.tsx)
```typescript
{
  title: 'New Users',
  href: '/dashboard/new-users',
  icon: UserPlus,
  superAdminOnly: true,
}
```

#### 2. 新用户管理页面 (apps/web/src/app/dashboard/new-users/page.tsx)
- 显示所有待审查的新用户
- 支持更改用户角色
- 支持标记用户为已审查
- 权限检查：仅 superadmin 可访问
- 实时更新：使用 tRPC 查询

#### 3. 用户管理页面增强 (apps/web/src/app/dashboard/users/page.tsx)
- 添加新用户计数查询
- 显示待审查新用户提示卡片
- 在用户列表中显示 🆕 标记
- 快速链接到新用户管理页面

### 类型定义更新 (packages/shared/src/types/user.ts)
```typescript
export interface User {
  // ... 现有字段
  isNewUser?: boolean; // 新用户标记
  reviewedAt?: Timestamp; // 审查时间
  reviewedBy?: string; // 审查者 UID
}
```

---

## 📁 修改的文件

### 后端
- `apps/api/src/routers/users.ts` - 添加 3 个新 API 方法

### 前端
- `apps/web/src/components/layout/Sidebar.tsx` - 添加菜单项
- `apps/web/src/app/dashboard/users/page.tsx` - 添加提示和标记
- `apps/web/src/app/dashboard/new-users/page.tsx` - 新建页面

### 共享类型
- `packages/shared/src/types/user.ts` - 更新 User 接口

---

## 🚀 部署步骤

### 1. 本地测试
```bash
# 构建共享包
cd packages/shared && pnpm build && cd ../..

# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

### 2. 验证功能
- 使用新 Gmail 账号注册
- 使用 superadmin 账号登录
- 访问新用户管理页面
- 测试所有功能（见测试指南）

### 3. 部署到生产环境
```bash
# 部署后端
./deploy-cloudrun.sh

# 部署前端
cd apps/web && pnpm build && vercel --prod
```

---

## 🔐 安全性

### 权限检查
- 所有新用户管理 API 都需要 superadmin 权限
- 前端页面有权限检查，非 superadmin 会被重定向
- Firestore 规则允许 superadmin 更新用户文档

### 数据保护
- 新用户信息只对 superadmin 可见
- 审查记录（reviewedAt, reviewedBy）被记录
- 用户无法自行标记为已审查

---

## 📊 数据库变更

### Firestore 集合：users

新增字段：
- `isNewUser` (boolean) - 标记新用户
- `reviewedAt` (Timestamp) - 审查时间
- `reviewedBy` (string) - 审查者 UID

### 查询优化
- 建议为 `users` 集合的 `isNewUser` 字段创建索引
- Firestore 会自动提示创建复合索引

---

## 🧪 测试覆盖

详见 `NEW_USERS_FEATURE_TEST_GUIDE.md`

测试场景：
1. 新用户注册和标记
2. Sidebar 菜单显示
3. 新用户管理页面
4. 新用户列表显示
5. 更改用户角色
6. 标记用户为已审查
7. 用户管理页面提示
8. 用户列表标记
9. 权限检查
10. 完整工作流

---

## 📝 API 文档

### listNewUsers
```
POST /trpc/users.listNewUsers
权限: superadmin
返回: { items: User[], total: number }
```

### getNewUsersCount
```
POST /trpc/users.getNewUsersCount
权限: superadmin
返回: { count: number }
```

### markUserAsReviewed
```
POST /trpc/users.markUserAsReviewed
权限: superadmin
输入: { userId: string }
返回: { success: boolean, message: string }
```

### updateUserRole (现有)
```
POST /trpc/users.updateUserRole
权限: superadmin
输入: { userId: string, role: 'user' | 'admin' | 'superadmin' }
返回: { success: boolean, message: string }
```

---

## 🎯 使用场景

### 场景 1: 新用户注册
1. 新用户使用 Google 账号登录
2. 系统自动创建用户文档，设置 `isNewUser: true`
3. 用户被创建为 `admin` 角色，可以访问 dashboard

### 场景 2: Superadmin 审查新用户
1. Superadmin 登录
2. 点击 Sidebar 中的 "New Users"
3. 查看新用户列表
4. 可以更改用户角色
5. 点击 "Approve" 标记为已审查
6. 用户从新用户列表中移除

### 场景 3: 用户管理概览
1. Superadmin 进入用户管理页面
2. 看到待审查新用户的提示
3. 可以快速导航到新用户管理页面
4. 在用户列表中看到新用户标记

---

## 🔄 后续改进建议

1. **邮件通知** - 新用户注册时发送邮件给 superadmin
2. **批量操作** - 支持批量审查多个新用户
3. **审查历史** - 显示审查历史和统计
4. **自动审查** - 基于规则自动审查某些用户
5. **拒绝功能** - 支持拒绝新用户注册

---

## 📞 支持

如有问题，请参考：
- 测试指南：`NEW_USERS_FEATURE_TEST_GUIDE.md`
- 代码注释：查看各文件中的 JSDoc 注释
- 日志：检查浏览器控制台和后端日志

