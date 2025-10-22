# 新用户管理功能 - 快速开始

## ✨ 功能亮点

✅ **自动新用户标记** - 新注册用户自动标记为待审查  
✅ **专属管理页面** - `/dashboard/new-users` 页面管理所有新用户  
✅ **Sidebar 菜单** - 快速访问新用户管理  
✅ **角色管理** - 审查时可以更改用户角色  
✅ **审查标记** - 标记用户为已审查并从列表中移除  
✅ **提示通知** - 用户管理页面显示待审查新用户数量  

---

## 🚀 快速部署

### 1. 本地测试（推荐）

```bash
# 构建共享包
cd packages/shared && pnpm build && cd ../..

# 启动开发服务器
pnpm dev

# 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:8080
```

### 2. 验证功能

```bash
# 1. 使用新 Gmail 账号注册
# 2. 使用 superadmin 账号登录 (yao.s.1216@gmail.com)
# 3. 点击 Sidebar 中的 "New Users"
# 4. 应该看到新用户列表
```

### 3. 生产部署

```bash
# 部署后端
./deploy-cloudrun.sh

# 部署前端
cd apps/web && pnpm build && vercel --prod
```

---

## 📖 使用指南

### 对于 Superadmin

#### 查看新用户
1. 登录应用
2. 点击 Sidebar 中的 **"New Users"** 菜单项
3. 查看所有待审查的新用户

#### 审查新用户
1. 在新用户列表中找到用户
2. 可选：使用下拉菜单更改用户角色
3. 点击 **"Approve"** 按钮标记为已审查
4. 用户将从新用户列表中移除

#### 快速概览
1. 进入 **"User Management"** 页面
2. 如果有待审查新用户，会看到蓝色提示卡片
3. 点击 **"Review"** 按钮快速导航到新用户页面

### 对于新用户

1. 使用 Google 账号登录
2. 自动被创建为 **Admin** 角色
3. 可以立即访问 dashboard
4. 等待 superadmin 审查

---

## 🔍 关键特性

### 新用户标记
- 新注册用户自动设置 `isNewUser: true`
- 在用户列表中显示 🆕 标记
- 在新用户管理页面中突出显示

### 角色管理
- 新用户默认创建为 **Admin** 角色
- Superadmin 可以在审查时更改角色
- 支持的角色：User、Admin、Super Admin

### 审查流程
1. 新用户注册 → `isNewUser: true`
2. Superadmin 审查 → 可选更改角色
3. Superadmin 批准 → `isNewUser: false`
4. 用户从新用户列表中移除

### 审查记录
- `reviewedAt` - 审查时间
- `reviewedBy` - 审查者 UID
- 用于审计和追踪

---

## 📊 数据结构

### 用户文档新增字段

```javascript
{
  id: "firebase-uid",
  email: "user@example.com",
  role: "admin",
  createdAt: Timestamp,
  lastLoginAt: Timestamp,
  isInitialized: false,
  
  // 新增字段
  isNewUser: true,           // 新用户标记
  reviewedAt: Timestamp,     // 审查时间（可选）
  reviewedBy: "superadmin-uid" // 审查者（可选）
}
```

---

## 🔐 权限控制

### 新用户管理页面
- ✅ Superadmin: 完全访问
- ❌ Admin: 无法访问（重定向到 dashboard）
- ❌ User: 无法访问（重定向到 dashboard）

### Sidebar 菜单
- ✅ Superadmin: 显示 "New Users" 菜单项
- ❌ Admin: 不显示
- ❌ User: 不显示

### API 端点
- 所有新用户管理 API 都需要 superadmin 权限
- 非 superadmin 调用会返回 403 Forbidden

---

## 🧪 测试检查清单

- [ ] 新用户自动标记为 `isNewUser: true`
- [ ] Sidebar 显示 "New Users" 菜单项
- [ ] 新用户管理页面可访问
- [ ] 新用户列表正确显示
- [ ] 可以更改新用户角色
- [ ] 可以标记用户为已审查
- [ ] 用户管理页面显示新用户提示
- [ ] 用户列表中显示新用户标记
- [ ] 非 superadmin 无法访问新用户页面
- [ ] 完整工作流正常运行

详见：`NEW_USERS_FEATURE_TEST_GUIDE.md`

---

## 📁 修改的文件

### 后端
```
apps/api/src/routers/users.ts
  ✅ 添加 isNewUser 字段
  ✅ 添加 listNewUsers() 方法
  ✅ 添加 getNewUsersCount() 方法
  ✅ 添加 markUserAsReviewed() 方法
```

### 前端
```
apps/web/src/components/layout/Sidebar.tsx
  ✅ 添加 UserPlus 图标
  ✅ 添加 "New Users" 菜单项

apps/web/src/app/dashboard/users/page.tsx
  ✅ 添加新用户计数查询
  ✅ 添加提示卡片
  ✅ 添加新用户标记

apps/web/src/app/dashboard/new-users/page.tsx
  ✅ 新建页面（完整实现）
```

### 类型定义
```
packages/shared/src/types/user.ts
  ✅ 添加 isNewUser 字段
  ✅ 添加 reviewedAt 字段
  ✅ 添加 reviewedBy 字段
```

---

## 🎯 常见问题

### Q: 新用户默认角色是什么？
A: 新用户默认创建为 **Admin** 角色，可以立即访问 dashboard。

### Q: 如何更改新用户的角色？
A: 在新用户管理页面中，使用下拉菜单选择新角色，然后点击 "Approve"。

### Q: 标记用户为已审查后会发生什么？
A: 用户的 `isNewUser` 字段设置为 `false`，用户从新用户列表中移除，但仍然出现在主用户列表中。

### Q: 非 superadmin 可以访问新用户管理页面吗？
A: 不可以。非 superadmin 用户会被重定向到 dashboard，并看到错误提示。

### Q: 如何查看审查历史？
A: 在 Firestore 中查看用户文档的 `reviewedAt` 和 `reviewedBy` 字段。

---

## 📞 获取帮助

### 文档
- 完整实现说明：`NEW_USERS_FEATURE_IMPLEMENTATION.md`
- 详细测试指南：`NEW_USERS_FEATURE_TEST_GUIDE.md`

### 调试
1. 检查浏览器控制台错误
2. 查看后端日志
3. 在 Firestore 中验证数据
4. 检查用户权限

### 支持
- 查看代码注释
- 检查 API 文档
- 运行测试脚本

---

## 🎉 完成！

新用户管理功能已完全实现。现在您可以：

1. ✅ 自动标记新用户
2. ✅ 在专属页面管理新用户
3. ✅ 审查和批准新用户
4. ✅ 更改用户角色
5. ✅ 查看待审查新用户提示

祝您使用愉快！

