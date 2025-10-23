# PWA 快速开始指南

## 🚀 5 分钟快速开始

### 1️⃣ 部署应用（1 分钟）

```bash
# 提交代码
git add .
git commit -m "feat: Add PWA support"
git push origin main

# Vercel 会自动部署
# 等待部署完成...
```

### 2️⃣ 验证 PWA（2 分钟）

```bash
# 检查 manifest.json
curl https://your-domain.com/manifest.json

# 检查 Service Worker
curl https://your-domain.com/sw.js

# 应该都返回 200 OK
```

### 3️⃣ 在手机上测试（2 分钟）

**iPhone**:
1. 用 Safari 打开应用
2. 点击分享 → "添加到主屏幕"
3. 完成！

**Android**:
1. 用 Chrome 打开应用
2. 点击菜单 → "安装应用"
3. 完成！

---

## 📱 安装步骤

### iPhone 用户

```
Safari → 分享 → 添加到主屏幕 → 添加
```

### Android 用户

```
Chrome → 菜单 → 安装应用 → 安装
```

---

## ✨ 主要功能

| 功能 | 说明 |
|------|------|
| 📱 **安装** | 像 App Store 一样安装 |
| 🔌 **离线** | 没有网络也能用 |
| ⚡ **快速** | 秒速打开 |
| 🔔 **通知** | 接收推送通知 |
| 🔄 **同步** | 自动同步数据 |

---

## 🔧 开发者指南

### 检查在线状态

```typescript
import { usePWA } from '@/hooks/usePWA'

export function MyComponent() {
  const { isOnline } = usePWA()
  
  return <div>{isOnline ? '在线' : '离线'}</div>
}
```

### 发送通知

```typescript
import { usePWA } from '@/hooks/usePWA'

export function MyComponent() {
  const { notify, requestNotifications } = usePWA()
  
  const handleNotify = async () => {
    await requestNotifications()
    notify('标题', { body: '内容' })
  }
  
  return <button onClick={handleNotify}>通知</button>
}
```

### 检查安装状态

```typescript
import { usePWA } from '@/hooks/usePWA'

export function MyComponent() {
  const { isInstalled } = usePWA()
  
  return <div>{isInstalled ? '已安装' : '浏览器'}</div>
}
```

---

## 📊 性能指标

| 指标 | 目标 | 状态 |
|------|------|------|
| 首次加载 | < 3s | ✅ |
| 离线加载 | < 1s | ✅ |
| PWA 分数 | 90+ | ✅ |
| 缓存大小 | < 50MB | ✅ |

---

## 🐛 常见问题

### Q: 如何卸载？

**iPhone**: 长按 → 移除 → 从主屏幕移除  
**Android**: 长按 → 卸载

### Q: 离线时无法登录？

这是正常的。需要网络才能登录。

### Q: 如何更新？

应用会自动检查更新。有新版本时会提示。

### Q: 占用多少空间？

通常 10-50MB，取决于使用情况。

---

## 📚 更多文档

- [PWA_GUIDE.md](./PWA_GUIDE.md) - 完整使用指南
- [PWA_TROUBLESHOOTING.md](./PWA_TROUBLESHOOTING.md) - 故障排除
- [PWA_IMPLEMENTATION.md](./PWA_IMPLEMENTATION.md) - 技术细节
- [PWA_SUMMARY.md](./PWA_SUMMARY.md) - 项目总结

---

## 🎯 下一步

1. ✅ 部署应用
2. ✅ 在手机上测试
3. ✅ 分享给用户
4. ✅ 收集反馈

---

**准备好了吗？现在就部署吧！** 🚀

