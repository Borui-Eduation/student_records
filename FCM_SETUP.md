# Firebase Cloud Messaging (FCM) 推送通知设置指南

## ✅ 已完成的实现

### 前端
- ✅ FCM SDK 集成 (`lib/fcm.ts`)
- ✅ Service Worker 推送事件处理 (`sw.js`, `firebase-messaging-sw.js`)
- ✅ PWA Hook 集成 (`hooks/usePWA.ts`)
- ✅ 通知设置界面 (`components/dashboard/NotificationSettings.tsx`)
- ✅ Manifest.json 配置 (gcm_sender_id)

### 后端
- ✅ tRPC 通知路由 (`routers/notifications.ts`)
- ✅ Token 管理 (保存/删除)
- ✅ 发送通知 API (单用户/广播)
- ✅ 测试通知端点

## 🔧 配置步骤

### 1. 获取 VAPID Key

1. 打开 [Firebase Console](https://console.firebase.google.com)
2. 选择您的项目：`student-records-d04c7`
3. 进入 **项目设置** ⚙️
4. 点击 **Cloud Messaging** 标签
5. 滚动到 **Web 推送证书** 部分
6. 点击 **生成密钥对** 按钮
7. 复制生成的 VAPID key (以 `B` 开头的长字符串)

### 2. 添加环境变量

#### 前端 (`apps/web/.env.local`)

```bash
# 添加 VAPID Key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=你的VAPID密钥
```

#### Vercel 部署

如果部署到 Vercel，需要在 Vercel 项目设置中添加环境变量：

1. 打开 Vercel Dashboard
2. 选择项目
3. 进入 **Settings** > **Environment Variables**
4. 添加：`NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### 3. 启用 Firebase Cloud Messaging

1. 在 Firebase Console 中
2. 进入 **Cloud Messaging**
3. 确认 **Cloud Messaging API** 已启用
4. 如果未启用，点击启用按钮

### 4. 测试推送通知

#### 本地测试

```bash
# 1. 启动开发服务器
pnpm dev:start

# 2. 打开浏览器访问
http://localhost:3000/dashboard/settings

# 3. 点击"启用通知"按钮
# 4. 允许浏览器通知权限
# 5. 点击"测试通知"按钮
```

#### iOS 测试 (需要 iOS 16.4+)

1. 在 Safari 中打开应用
2. 点击分享按钮 
3. 选择"添加到主屏幕"
4. 从主屏幕打开应用
5. 进入设置页面
6. 启用通知并测试

## 📱 使用方式

### 用户端

1. **启用通知**
   - 进入 `Dashboard` > `Settings`
   - 点击"启用通知"
   - 允许浏览器权限
   - 测试通知确认工作正常

2. **禁用通知**
   - 进入设置页面
   - 点击"禁用"按钮

### 管理员端

#### 发送给特定用户

```typescript
// 通过 tRPC 调用
await trpc.notifications.sendToUser.mutate({
  userId: 'user-id',
  title: '新消息',
  body: '您有一个新的课时记录',
  url: '/dashboard/sessions',
})
```

#### 广播给所有用户 (仅 superadmin)

```typescript
await trpc.notifications.broadcast.mutate({
  title: '系统通知',
  body: '系统将于今晚维护',
  url: '/dashboard',
})
```

## 🎯 支持的平台

| 平台 | 支持状态 | 要求 |
|------|---------|------|
| **iOS Safari** | ✅ 支持 | iOS 16.4+, 需要添加到主屏幕 |
| **Android Chrome** | ✅ 支持 | Android 5.0+ |
| **桌面 Chrome** | ✅ 支持 | 无特殊要求 |
| **桌面 Firefox** | ✅ 支持 | 无特殊要求 |
| **桌面 Safari** | ⚠️ 部分支持 | macOS 13+ |
| **桌面 Edge** | ✅ 支持 | 无特殊要求 |

## 🔍 API 端点

### tRPC 路由：`notifications.*`

- `saveToken` - 保存 FCM token
- `deleteToken` - 删除 FCM token
- `getToken` - 获取用户的 token
- `sendToUser` - 发送给特定用户 (需要 admin)
- `broadcast` - 广播给所有用户 (需要 superadmin)
- `sendTest` - 发送测试通知

## 💾 数据结构

### Firestore Collection: `fcmTokens`

```typescript
{
  userId: string
  token: string
  deviceInfo: {
    platform: 'ios' | 'android' | 'web'
    userAgent?: string
  }
  createdAt: string (ISO)
  updatedAt: string (ISO)
}
```

## 🚨 常见问题

### Q: iOS 不显示通知？

**A:** 确保：
1. iOS 16.4 或更高版本
2. 应用已添加到主屏幕
3. 从主屏幕启动（不是 Safari）
4. 已允许通知权限

### Q: 浏览器不请求权限？

**A:** 确保：
1. 使用 HTTPS（生产环境）或 localhost
2. Service Worker 已注册成功
3. 检查浏览器控制台错误

### Q: Token 保存失败？

**A:** 检查：
1. VAPID key 配置正确
2. Firebase Cloud Messaging API 已启用
3. 用户已登录
4. 后端 API 可访问

### Q: 推送不工作？

**A:** 调试步骤：
1. 检查浏览器控制台 `[FCM]` 日志
2. 测试通知功能
3. 验证 Service Worker 状态: `chrome://serviceworker-internals`
4. 查看后端日志

## 💰 费用

Firebase Cloud Messaging 完全免费：
- ✅ 无限推送消息
- ✅ 无限设备
- ✅ 全平台支持
- ✅ 无隐藏费用

## 📚 相关文档

- [Firebase Cloud Messaging 文档](https://firebase.google.com/docs/cloud-messaging)
- [Web Push 协议](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [iOS PWA 推送通知](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

---

**实施日期**: 2025-10-23  
**完全免费** | **支持 iOS/Android/Desktop**

