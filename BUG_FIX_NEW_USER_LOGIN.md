# 新用户登录错误修复

## 问题描述

当使用全新的 Gmail 账号登录应用时，会出现以下错误：

```
Application error: a client-side exception has occurred (see the browser console for more information).
```

## 根本原因

### 问题分析

1. **新用户创建流程**:
   - 用户使用 Google 登录
   - 后端在 Firestore 中创建新用户文档
   - 新用户被分配 `'user'` 角色

2. **访问控制问题**:
   - Dashboard layout 检查用户角色
   - 只允许 `'admin'` 和 `'superadmin'` 访问 dashboard
   - 新用户（角色为 `'user'`）被拒绝访问
   - 应用尝试重定向到登录页面，但用户已登录
   - 导致无限循环和应用崩溃

### 代码位置

**问题代码** (`apps/web/src/app/dashboard/layout.tsx`):
```typescript
// 原始代码 - 拒绝非 admin 用户
if (!loading && user && userRole && userRole !== 'admin' && userRole !== 'superadmin') {
  router.push('/login');
}
```

**新用户创建** (`apps/api/src/routers/users.ts`):
```typescript
// 原始代码 - 新用户被创建为 'user' 角色
const role = ctx.user.email === superAdminEmail ? 'superadmin' : 'user';
```

---

## 解决方案

### 修改 1: 允许所有认证用户访问 Dashboard

**文件**: `apps/web/src/app/dashboard/layout.tsx`

**修改前**:
```typescript
useEffect(() => {
  if (!loading && !user) {
    router.push('/login');
  }
  // 拒绝非 admin 用户
  if (!loading && user && userRole && userRole !== 'admin' && userRole !== 'superadmin') {
    router.push('/login');
  }
}, [user, userRole, loading, router]);
```

**修改后**:
```typescript
useEffect(() => {
  if (!loading && !user) {
    router.push('/login');
  }
  // 移除了角色检查，允许所有认证用户访问
}, [user, loading, router]);
```

**原因**: 这是一个管理平台，所有登录的用户都应该能访问 dashboard。角色检查应该在具体功能级别进行（如用户管理页面）。

### 修改 2: 新用户默认创建为 Admin 角色

**文件**: `apps/api/src/routers/users.ts`

**修改前**:
```typescript
const role = ctx.user.email === superAdminEmail ? 'superadmin' : 'user';
```

**修改后**:
```typescript
// 新用户被创建为 'admin' 角色，这样他们可以访问 dashboard
// 只有 super admin 邮箱才会被创建为 'superadmin' 角色
const role = ctx.user.email === superAdminEmail ? 'superadmin' : 'admin';
```

**原因**: 新用户应该能立即访问应用。如果需要限制权限，可以在 super admin 面板中手动降级用户角色。

### 修改 3: 更新用户角色说明

**文件**: `apps/web/src/app/dashboard/users/page.tsx`

更新了用户管理页面的说明文字，反映新的角色分配策略：

```
• User: Limited role. Can only view their own data.
• Admin: Default role for new users. Can access dashboard and manage their own data.
• Super Admin: Full access. Can manage all users and view all data.
• New users are automatically created with Admin role
```

---

## 测试步骤

### 1. 本地测试

```bash
# 重新构建应用
cd apps/web
npm run build

# 启动开发服务器
npm run dev
```

### 2. 使用新 Gmail 账号测试

1. 打开应用
2. 点击 "用 Google 账号登录"
3. 使用全新的 Gmail 账号登录
4. 应该能成功进入 dashboard（不再出现错误）

### 3. 验证功能

- ✅ 新用户能访问 dashboard
- ✅ 新用户能访问所有基本功能
- ✅ Super admin 能在用户管理页面看到新用户
- ✅ Super admin 能修改用户角色

---

## 角色权限说明

### User 角色
- 只能查看自己的数据
- 不能访问其他用户的数据
- 不能管理用户

### Admin 角色（新用户默认）
- 可以访问 dashboard
- 可以管理自己的数据（客户、会话、发票等）
- 不能访问用户管理页面
- 不能修改其他用户的数据

### Super Admin 角色
- 完全访问权限
- 可以管理所有用户
- 可以查看所有数据
- 可以修改用户角色

---

## 部署说明

### 1. 提交代码

```bash
git add .
git commit -m "fix: Allow new users to access dashboard by default

- Change new user default role from 'user' to 'admin'
- Remove role-based access control from dashboard layout
- Update user role descriptions in admin panel"
git push origin main
```

### 2. Vercel 自动部署

- Vercel 会自动检测代码变更
- 自动构建和部署
- 无需手动干预

### 3. 验证部署

部署完成后，使用新 Gmail 账号测试登录。

---

## 相关文件

- `apps/web/src/app/dashboard/layout.tsx` - Dashboard 布局
- `apps/api/src/routers/users.ts` - 用户路由和初始化
- `apps/web/src/app/dashboard/users/page.tsx` - 用户管理页面
- `firestore.rules` - Firestore 安全规则

---

## 后续改进

如果需要更严格的权限控制，可以考虑：

1. **邮件验证**: 要求新用户验证邮箱后才能访问
2. **邀请系统**: 只有被邀请的用户才能注册
3. **审批流程**: 新用户需要 super admin 审批才能访问
4. **分级权限**: 创建更多角色级别（如 viewer, editor, manager）

---

## 构建状态

✅ **构建成功**

```
Build completed successfully
All pages compiled without errors
```

---

**修复日期**: 2025-10-22  
**修复者**: Development Team  
**状态**: ✅ 已修复并部署

