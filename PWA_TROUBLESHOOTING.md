# PWA 故障排除指南

## 开发者调试

### 检查 Service Worker 状态

#### Chrome DevTools

1. 打开 Chrome DevTools（F12）
2. 进入 **Application** 标签
3. 左侧选择 **Service Workers**
4. 查看 Service Worker 状态

**状态说明**:
- 🟢 **activated and running** - 正常运行
- 🟡 **waiting to activate** - 有新版本待激活
- 🔴 **redundant** - 已被替换

#### Firefox DevTools

1. 打开 Firefox DevTools（F12）
2. 进入 **Storage** 标签
3. 展开 **Service Workers**
4. 查看注册状态

### 检查缓存

#### Chrome

1. DevTools → **Application**
2. 左侧 **Cache Storage**
3. 查看缓存内容

**缓存名称**:
- `professional-workspace-v1` - 静态资源
- `professional-workspace-runtime-v1` - 页面
- `professional-workspace-api-v1` - API 响应
- `professional-workspace-images-v1` - 图片

#### Firefox

1. DevTools → **Storage**
2. **Cache Storage**
3. 查看缓存内容

### 查看 Service Worker 日志

在浏览器控制台中查看 PWA 日志：

```javascript
// 查看所有 PWA 日志
console.log('查看浏览器控制台中的 [SW] 前缀日志')

// 手动检查 Service Worker 状态
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Worker 注册:', registrations)
})
```

---

## 常见问题和解决方案

### 1. Service Worker 无法注册

**症状**: 
- 应用无法离线使用
- 控制台显示注册错误

**原因**:
- HTTPS 未配置
- Service Worker 文件不存在
- 浏览器不支持

**解决方案**:
```bash
# 检查 HTTPS
curl -I https://your-domain.com

# 检查 Service Worker 文件
curl https://your-domain.com/sw.js

# 检查浏览器支持
# 在控制台运行:
'serviceWorker' in navigator  // 应该返回 true
```

### 2. 缓存不工作

**症状**:
- 离线时无法使用
- 页面无法加载

**原因**:
- Service Worker 未激活
- 缓存策略配置错误
- 存储空间不足

**解决方案**:
```javascript
// 清除所有缓存
caches.keys().then(names => {
  names.forEach(name => caches.delete(name))
})

// 重新注册 Service Worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister())
})

// 刷新页面
location.reload()
```

### 3. 应用无法更新

**症状**:
- 新版本无法加载
- 旧版本一直显示

**原因**:
- 缓存版本过期
- Service Worker 未更新
- 浏览器缓存问题

**解决方案**:
```bash
# 方法 1: 硬刷新
# Windows/Linux: Ctrl + Shift + R
# Mac: Cmd + Shift + R

# 方法 2: 清除缓存
# Chrome: 设置 → 隐私 → 清除浏览数据

# 方法 3: 卸载并重新安装 PWA
```

### 4. 推送通知不工作

**症状**:
- 无法接收通知
- 通知权限被拒绝

**原因**:
- 未授予通知权限
- Service Worker 未激活
- 浏览器不支持

**解决方案**:
```javascript
// 检查通知权限
Notification.permission  // 应该是 'granted'

// 请求权限
Notification.requestPermission().then(permission => {
  console.log('权限:', permission)
})

// 测试通知
new Notification('测试通知', {
  body: '这是一条测试通知'
})
```

### 5. 离线时无法登录

**症状**:
- 离线时登录失败
- 无法访问受保护的页面

**原因**:
- 这是正常行为
- 登录需要网络连接
- 认证信息需要从服务器验证

**解决方案**:
- 这不是问题，是设计特性
- 用户需要网络连接才能登录
- 登录后可以离线使用

### 6. 存储空间不足

**症状**:
- 缓存无法保存
- 应用加载缓慢

**原因**:
- 设备存储空间不足
- 缓存文件过大
- 其他应用占用空间

**解决方案**:
```javascript
// 检查可用存储空间
navigator.storage.estimate().then(estimate => {
  console.log('已用:', estimate.usage)
  console.log('总量:', estimate.quota)
})

// 清除缓存
caches.keys().then(names => {
  names.forEach(name => caches.delete(name))
})
```

---

## 性能优化

### 缓存策略优化

```javascript
// 查看缓存大小
async function getCacheSize() {
  const cacheNames = await caches.keys()
  let totalSize = 0
  
  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const keys = await cache.keys()
    for (const request of keys) {
      const response = await cache.match(request)
      if (response) {
        totalSize += response.headers.get('content-length') || 0
      }
    }
  }
  
  console.log('缓存总大小:', (totalSize / 1024 / 1024).toFixed(2), 'MB')
}
```

### 监控 Service Worker 性能

```javascript
// 监控 Service Worker 更新时间
navigator.serviceWorker.ready.then(registration => {
  registration.addEventListener('updatefound', () => {
    const startTime = performance.now()
    const newWorker = registration.installing
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'activated') {
        const updateTime = performance.now() - startTime
        console.log('更新耗时:', updateTime, 'ms')
      }
    })
  })
})
```

---

## 测试清单

### 功能测试

- [ ] Service Worker 成功注册
- [ ] 应用可以离线使用
- [ ] 缓存正确保存
- [ ] 网络恢复时自动同步
- [ ] 推送通知正常工作
- [ ] 应用可以更新

### 性能测试

- [ ] 首次加载时间 < 3s
- [ ] 离线加载时间 < 1s
- [ ] 缓存大小 < 50MB
- [ ] Lighthouse PWA 分数 > 90

### 兼容性测试

- [ ] iOS Safari 正常工作
- [ ] Android Chrome 正常工作
- [ ] Firefox 正常工作
- [ ] Edge 正常工作

---

## 获取更多帮助

### 查看日志

```bash
# 查看 Service Worker 日志
# Chrome: DevTools → Console → 搜索 [SW]

# 查看网络请求
# Chrome: DevTools → Network → 查看缓存状态
```

### 联系支持

如果问题仍未解决，请提供：
1. 浏览器版本
2. 操作系统版本
3. 错误信息截图
4. 浏览器控制台日志

---

**版本**: 1.0  
**最后更新**: 2025-10-22

