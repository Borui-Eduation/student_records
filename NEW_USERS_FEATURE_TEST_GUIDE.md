# 新用户管理功能测试指南

## 功能概述

本功能为 superadmin 添加了新用户管理系统，包括：

1. **新用户标记** - 新注册用户自动标记为 `isNewUser: true`
2. **新用户管理页面** - `/dashboard/new-users` 页面显示所有待审查的新用户
3. **Sidebar 菜单** - 为 superadmin 添加 "New Users" 菜单项
4. **用户升级功能** - superadmin 可以在审查时更改新用户的角色
5. **审查标记** - superadmin 可以标记用户为已审查，将其从新用户列表中移除
6. **提示通知** - 用户管理页面显示待审查新用户的数量和快速链接

---

## 🧪 测试步骤

### 前置条件

1. 确保 superadmin 账号已配置：`yao.s.1216@gmail.com`
2. 运行本地开发服务器：`pnpm dev`
3. 前端访问：http://localhost:3000
4. 后端 API：http://localhost:8080

### 测试 1: 新用户注册和标记

**目标**: 验证新用户注册时自动标记为 `isNewUser: true`

**步骤**:
1. 使用新的 Gmail 账号登录应用
2. 应该能成功进入 dashboard
3. 打开浏览器开发者工具 (F12)
4. 在 Firestore 中查看用户文档：
   - 打开 Firebase Console
   - 导航到 Firestore Database
   - 查看 `users` 集合中的新用户文档
   - 验证 `isNewUser: true` 字段存在

**预期结果**: ✅ 新用户文档包含 `isNewUser: true`

---

### 测试 2: Sidebar 菜单项

**目标**: 验证 superadmin 可以看到 "New Users" 菜单项

**步骤**:
1. 使用 superadmin 账号登录 (yao.s.1216@gmail.com)
2. 进入 dashboard
3. 查看左侧 sidebar
4. 应该看到 "New Users" 菜单项（带 UserPlus 图标）

**预期结果**: ✅ Sidebar 中显示 "New Users" 菜单项

---

### 测试 3: 新用户管理页面

**目标**: 验证新用户管理页面正确显示新用户列表

**步骤**:
1. 使用 superadmin 账号登录
2. 点击 sidebar 中的 "New Users" 菜单项
3. 应该进入 `/dashboard/new-users` 页面
4. 页面应该显示：
   - 标题："New Users"
   - 待审查新用户的数量
   - 新用户列表（如果有新用户）

**预期结果**: ✅ 页面正确加载并显示新用户列表

---

### 测试 4: 新用户列表显示

**目标**: 验证新用户在列表中正确显示

**步骤**:
1. 在新用户管理页面中
2. 应该看到新用户的：
   - 邮箱地址
   - 🆕 New User 标记（蓝色 badge）
   - 注册时间
   - 当前角色（默认为 Admin）
   - 角色选择下拉菜单
   - "Approve" 按钮

**预期结果**: ✅ 新用户信息完整显示

---

### 测试 5: 更改新用户角色

**目标**: 验证 superadmin 可以在审查时更改新用户的角色

**步骤**:
1. 在新用户管理页面中
2. 选择一个新用户
3. 点击角色下拉菜单
4. 选择不同的角色（例如：User 或 Super Admin）
5. 应该看到成功提示
6. 在 Firestore 中验证角色已更新

**预期结果**: ✅ 用户角色成功更新

---

### 测试 6: 标记用户为已审查

**目标**: 验证 superadmin 可以标记用户为已审查

**步骤**:
1. 在新用户管理页面中
2. 选择一个新用户
3. 点击 "Approve" 按钮
4. 应该看到成功提示
5. 用户应该从新用户列表中消失
6. 在 Firestore 中验证：
   - `isNewUser: false`
   - `reviewedAt` 字段已设置
   - `reviewedBy` 字段包含 superadmin 的 UID

**预期结果**: ✅ 用户标记为已审查并从列表中移除

---

### 测试 7: 用户管理页面提示

**目标**: 验证用户管理页面显示新用户提示

**步骤**:
1. 使用 superadmin 账号登录
2. 进入 User Management 页面 (`/dashboard/users`)
3. 如果有待审查的新用户，应该看到：
   - 蓝色提示卡片
   - 显示新用户数量
   - "Review" 按钮链接到新用户页面
4. 点击 "Review" 按钮应该导航到新用户页面

**预期结果**: ✅ 提示卡片正确显示并可点击

---

### 测试 8: 用户列表中的新用户标记

**目标**: 验证用户管理页面中的用户列表显示新用户标记

**步骤**:
1. 在用户管理页面中
2. 查看用户列表
3. 对于标记为 `isNewUser: true` 的用户，应该看到：
   - 🆕 New 标记（蓝色 badge）
   - 显示在邮箱下方

**预期结果**: ✅ 新用户标记正确显示

---

### 测试 9: 权限检查

**目标**: 验证非 superadmin 用户无法访问新用户管理页面

**步骤**:
1. 使用普通 admin 账号登录
2. 尝试访问 `/dashboard/new-users`
3. 应该被重定向到 dashboard
4. 应该看到错误提示："Access Denied"
5. Sidebar 中不应该显示 "New Users" 菜单项

**预期结果**: ✅ 权限检查正确工作

---

### 测试 10: 完整工作流

**目标**: 验证完整的新用户管理工作流

**步骤**:
1. 使用新 Gmail 账号注册
2. 使用 superadmin 账号登录
3. 进入新用户管理页面
4. 看到新用户
5. 更改用户角色为 "User"
6. 点击 "Approve" 按钮
7. 用户从新用户列表中消失
8. 进入用户管理页面
9. 验证用户出现在主用户列表中
10. 验证用户不再有 🆕 标记

**预期结果**: ✅ 完整工作流正常运行

---

## 📋 API 端点测试

### 1. 获取新用户列表

```bash
curl -X POST http://localhost:8080/trpc/users.listNewUsers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**预期响应**:
```json
{
  "result": {
    "data": {
      "items": [...],
      "total": 2
    }
  }
}
```

### 2. 获取新用户计数

```bash
curl -X POST http://localhost:8080/trpc/users.getNewUsersCount \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**预期响应**:
```json
{
  "result": {
    "data": {
      "count": 2
    }
  }
}
```

### 3. 标记用户为已审查

```bash
curl -X POST http://localhost:8080/trpc/users.markUserAsReviewed \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}'
```

**预期响应**:
```json
{
  "result": {
    "data": {
      "success": true,
      "message": "User marked as reviewed"
    }
  }
}
```

---

## 🐛 故障排除

### 问题 1: "New Users" 菜单项不显示

**原因**: 用户不是 superadmin

**解决方案**:
1. 确保使用 superadmin 账号登录
2. 检查 Firestore 中用户的 `role` 字段是否为 `superadmin`
3. 运行 `node scripts/set-superadmin.js yao.s.1216@gmail.com superadmin`

### 问题 2: 新用户列表为空

**原因**: 没有新用户或所有用户都已审查

**解决方案**:
1. 使用新 Gmail 账号注册
2. 检查 Firestore 中是否有 `isNewUser: true` 的用户

### 问题 3: 无法更改用户角色

**原因**: 权限不足或 API 错误

**解决方案**:
1. 确保使用 superadmin 账号
2. 检查浏览器控制台是否有错误
3. 查看后端日志

---

## ✅ 测试检查清单

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

---

## 📞 支持

如有问题，请检查：
1. 浏览器控制台错误
2. 后端日志
3. Firestore 数据
4. Firebase 权限规则

