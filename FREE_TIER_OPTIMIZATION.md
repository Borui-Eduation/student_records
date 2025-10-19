# 学生记录系统 - 免费额度优化指南

> **目标**: 在Google Cloud Free Tier、Firebase Free Tier、Gemini Free Tier、Vercel Free Plan内完全运行系统  
> **更新日期**: 2025-10-19

---

## 📊 免费额度概览

### Cloud Run (后端)
**每月免费:**
- ✅ 200万次请求
- ✅ 360,000 vCPU-秒
- ✅ 180,000 GB-秒内存

**每日预计使用:**
- 活跃用户: 5-10人
- 每用户请求: ~50次/天
- **每日预计**: 250-500次请求 (**充足**)

**优化策略:**
- 设置最大实例数为 2（防止意外扩展）
- 并发请求数设为 80
- 最小实例数为 1（冷启动可接受）

### Firebase Firestore (数据库)
**每天免费:**
- ✅ 50,000 文档读取
- ✅ 20,000 文档写入
- ✅ 20,000 文档删除
- ✅ 1 GB 存储

**每日预计使用:**
- 活跃用户: 5-10人
- 用户会话读取: ~200次 (50×4用户)
- 用户会话查询: ~100次
- 缓存命中率: 60%（通过混合缓存）
- **每日预计**: 5,000-8,000 读取 (**充足**, < 50,000)
- **写入预计**: 1,000-2,000 (**充足**, < 20,000)

**优化策略:**
- L1 内存缓存 (热数据, 5分钟TTL)
- L2 Firestore缓存 (冷数据, 1天TTL)
- 字段投影（只查询必需字段）
- 批量操作减少读写次数

### Gemini API (AI助手)
**每分钟免费:**
- ✅ 15 请求
- ✅ 每小时900次
- ✅ 每天 21,600次

**每日预计使用:**
- 活跃用户: 5-10人
- AI查询/用户: ~5次/天
- **每日预计**: 25-50次 (**充足**, < 21,600)

**优化策略:**
- 请求队列处理（速率限制）
- 优先级队列（高优先级优先）
- 指数退避重试机制
- 客户端缓存（避免重复查询）

### Vercel (前端)
**每月免费:**
- ✅ 100 GB 出站带宽
- ✅ 无限部署
- ✅ 自动SSL

**每月预计使用:**
- 日活用户: 5-10人
- 月活用户: 50-100人
- 页面大小: ~500 KB (优化后)
- **每月预计**: 2.5-5 GB (**充足**, < 100 GB)

**优化策略:**
- 代码分割和动态导入
- 图片优化（WebP/AVIF）
- Gzip压缩
- CDN缓存头部优化

---

## 🛠️ 实施的优化措施

### 1. 混合缓存系统 ✅

**实现**: `apps/api/src/services/cache.ts`

```typescript
// 两层缓存策略
L1: 内存缓存    (5分钟TTL)  - 零成本，极快
L2: Firestore缓存 (1天TTL)   - 低成本，持久化
```

**预期效果:**
- 缓存命中率: 60-70% (L1) + 15-20% (L2)
- Firestore读取减少: **70-80%**
- 成本节省: **70-80%**
- 响应时间: 平均 50ms → 20ms

**使用示例:**
```typescript
const cache = getCache();

// 获取数据
const data = await cache.get('clients:user-123');

// 设置数据
await cache.set('clients:user-123', clientList, {
  memoryTtl: 5,    // 内存缓存5分钟
  firestoreTtl: 1  // Firestore缓存1天
});

// 删除缓存
await cache.delete('clients:user-123');
```

### 2. Gemini API 速率限制 ✅

**实现**: `apps/api/src/services/geminiRateLimiter.ts`

```typescript
// Free Tier 限制: 15请求/分钟
// 实现特性:
- 请求队列 (先进先出 + 优先级)
- 自动速率限制检测
- 指数退避重试 (max 3次)
- 超时处理 (30秒请求超时)
```

**预期效果:**
- 避免429错误
- 平均响应时间: < 5秒
- 用户体验: 平滑的排队

**使用示例:**
```typescript
const limiter = getRateLimiter();

// 高优先级请求
const result = await limiter.executeWithRateLimit(
  () => geminiAI.parse(userInput),
  'high'
);

// 查看状态
const status = limiter.getStatus();
console.log(`使用: ${status.requestsUsed}/${RATE_LIMIT_REQUESTS}`);
```

### 3. React Query 智能缓存

**配置**: `apps/web/src/lib/trpcClient.ts`

```typescript
// 缓存策略
staleTime: 5 * 60 * 1000,      // 5分钟
gcTime: 15 * 60 * 1000,        // 15分钟（垃圾回收）
retry: 2,                        // 失败重试2次
refetchOnWindowFocus: 'stale',   // 窗口聚焦时仅在过期时重新获取
```

**预期效果:**
- 前端API调用减少: 50-60%
- 用户感知延迟: 减少 30-40%

---

## 📈 监控和告警配置

### Cloud Run 监控

```bash
# 查看资源使用情况
gcloud run services describe student-record-api --region us-west1

# 查看日志
gcloud run services logs read student-record-api --region us-west1 --limit=50

# 设置预算警告
gcloud billing budgets create student-record-budget \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="Student Record Free Tier" \
  --budget-amount=1 \
  --threshold-rule=percent=100
```

### Firebase 监控

**在 Firebase Console:**
1. 进入 Firestore 数据库
2. 选择"使用情况"标签
3. 查看每日读写统计

**设置警告:**
1. Google Cloud Console → 预算和提醒
2. 创建预算（建议 $1-2/月）
3. 设置通知阈值：50%、90%、100%

### 应用内监控

```typescript
// 在 API 路由中添加监控
app.use('/trpc', (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('API call', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });
  
  next();
});
```

---

## 🚨 成本超支防护

### 自动防护措施

1. **Cloud Run 配置**
   ```yaml
   maxInstances: 2          # 最多2个实例
   memory: 512Mi            # 每个实例512MB
   cpu: 1                   # 每个实例1个vCPU
   ```

2. **Firestore 安全规则**
   ```firestore
   // 限制大批量删除
   allow delete: if request.size <= 100;
   
   // 限制查询范围
   allow read: if request.query.limit <= 100;
   ```

3. **API 速率限制**
   ```typescript
   app.use(rateLimit({
     windowMs: 15 * 60 * 1000,  // 15分钟
     max: 100,                   // 每个IP最多100请求
   }));
   ```

### 手动检查清单

**每周检查:**
- ☐ Firestore 使用情况 (目标 < 8,000 读/天)
- ☐ Cloud Run 请求数 (目标 < 300,000/月)
- ☐ Vercel 带宽使用 (目标 < 5 GB/月)
- ☐ Gemini API 调用 (目标 < 10,000/天)

**发现异常时:**
1. 检查日志找出原因
2. 清空缓存（如果是缓存问题）
3. 临时提高速率限制或扩展预算

---

## 💰 成本预估

### 完全免费情况 (预期)

| 服务 | 配额 | 预计使用 | 状态 |
|-----|------|--------|------|
| Cloud Run | 2M请求/月 | 150K | ✅ 充足 |
| Firestore | 50K读/天 | 8K | ✅ 充足 |
| Gemini API | 15req/min | 50/天 | ✅ 充足 |
| Vercel | 100GB/月 | 3GB | ✅ 充足 |
| **总计** | - | **$0** | ✅ 免费 |

### 可能产生费用的情况

**高使用场景** (100活跃用户, 10倍使用量):

| 服务 | 配额用尽后费用 | 预计成本 |
|-----|-------------|--------|
| Cloud Run | $0.00002单位秒 | $5-10 |
| Firestore | $0.06/100K读 | $5-10 |
| Gemini API | 按使用量计费 | $2-5 |
| **月总计** | - | **$12-25** |

---

## 🔍 成本优化检查清单

### 月度检查 ☐

- ☐ 验证所有缓存策略正确运行
- ☐ 检查是否有N+1查询
- ☐ 清理过期的缓存数据
- ☐ 审查Firestore读写统计
- ☐ 验证没有无限循环的API调用

### 季度检查 ☐

- ☐ 分析使用趋势
- ☐ 评估缓存TTL是否需要调整
- ☐ 检查是否需要添加更多索引
- ☐ 性能基准测试
- ☐ 更新成本预估

### 年度检查 ☐

- ☐ 评估是否应升级到付费计划
- ☐ 分析ROI和成本效益
- ☐ 制定2025年预算
- ☐ 考虑架构优化

---

## 📚 参考文档

- [Google Cloud Free Tier](https://cloud.google.com/free/docs/free-cloud-features)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Vercel Pricing](https://vercel.com/pricing)

---

## 🎯 后续优化

### 已实施 ✅
- [x] 混合缓存系统
- [x] Gemini 速率限制
- [x] React Query 缓存
- [x] Firestore 查询优化

### 计划中 (当使用量增加时)
- [ ] Upstash Redis (€6.99/月，需要时升级)
- [ ] Cloud CDN 缓存
- [ ] 数据库分片
- [ ] 微服务拆分

### 不建议 (在免费阶段)
- ❌ Redis 完整部署
- ❌ Sentry 完整集成
- ❌ Analytics 深度集成
- ❌ 多区域冗余

---

**状态**: ✅ 完全免费配置已就绪  
**预期运行时间**: 无限期（在配额内）  
**月度成本**: $0 - $5 (取决于使用量)
