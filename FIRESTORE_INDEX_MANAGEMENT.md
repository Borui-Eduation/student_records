# 🔥 Firestore 索引管理指南

## 问题说明

Firestore 在执行以下查询时需要**复合索引**：
- 多个 `where` 筛选
- `where` + `orderBy` 组合
- 多个 `orderBy` 排序

动态查询系统会生成各种查询组合，因此需要系统化管理索引。

---

## 📋 索引管理方案

### 方案 1: 自动生成索引（推荐✨）

#### 使用自动生成脚本

```bash
# 1. 运行索引生成脚本
node scripts/generate-indexes.js

# 输出示例:
# 🔥 生成 Firestore 索引配置...
# ✅ 备份旧索引文件到: firestore.indexes.backup.json
# ✅ 生成 127 个索引配置
# ✅ 已写入: firestore.indexes.json
#
# 📊 每个集合的索引数量:
#    sessions: 32 个索引
#    clients: 12 个索引
#    rates: 18 个索引
#    knowledgeBase: 15 个索引
#    expenses: 28 个索引
#    invoices: 12 个索引
#    sessionTypes: 4 个索引
#    clientTypes: 6 个索引
```

#### 部署索引到 Firestore

```bash
# 2. 部署索引（需要 Firebase CLI）
firebase deploy --only firestore:indexes

# 或使用 npm script
npm run deploy:indexes
```

#### 监控索引构建状态

```bash
# 在 Firebase Console 查看
# https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes

# 或使用 CLI
firebase firestore:indexes
```

---

### 方案 2: 运行时自动检测（已集成✅）

系统会自动检测需要的索引并在日志中输出建议。

#### 日志示例

```
[WARN] 可能需要 Firestore 复合索引
  collection: sessions
  fields: userId, clientName, date
  reason: 查询 sessions 集合，筛选字段: clientName，排序字段: date

[INFO] 建议的索引配置:
{
  "collectionGroup": "sessions",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "clientName", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "DESCENDING" }
  ]
}

[INFO] 或使用 Firebase CLI 创建索引:
  firebase firestore:indexes:create sessions userId:ASCENDING,clientName:ASCENDING,date:DESCENDING
```

#### 如何处理缺失索引警告

**步骤 1**: 查看应用日志，找到 `[WARN] 可能需要 Firestore 复合索引` 消息

**步骤 2**: 复制建议的索引配置

**步骤 3**: 添加到 `firestore.indexes.json`

```json
{
  "indexes": [
    // ... 现有索引 ...
    
    // 新添加的索引
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "clientName", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**步骤 4**: 部署索引

```bash
firebase deploy --only firestore:indexes
```

---

### 方案 3: 错误驱动创建（被动）

#### 当查询失败时

Firestore 会返回错误，并提供创建索引的链接：

```
Error: The query requires an index. 
You can create it here: 
https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes?create_composite=...
```

**处理方式:**
1. 点击链接，自动创建索引
2. 或者从错误信息中提取索引定义，添加到 `firestore.indexes.json`

---

## 🎯 推荐的索引管理流程

### 开发阶段

1. **运行自动生成脚本** (一次性)
   ```bash
   node scripts/generate-indexes.js
   firebase deploy --only firestore:indexes
   ```

2. **启用索引检测日志**
   - 系统已自动集成 `indexDetector`
   - 查看应用日志，关注 `[WARN]` 级别消息

3. **测试常见查询**
   - 在本地或开发环境测试各种查询
   - 收集缺失的索引需求

### 生产部署前

1. **审查 `firestore.indexes.json`**
   - 确保所有必需的索引都已定义

2. **预部署索引**
   ```bash
   firebase deploy --only firestore:indexes --project production
   ```

3. **等待索引构建完成**
   - 大型数据库可能需要几小时
   - 在 Firebase Console 监控构建进度

4. **部署应用代码**
   ```bash
   npm run deploy
   ```

### 运营阶段

1. **监控日志**
   - 定期检查 `[WARN] 可能需要 Firestore 复合索引` 消息
   - 发现新的查询模式

2. **增量添加索引**
   - 根据实际使用情况添加新索引
   - 避免过度索引（浪费存储和写入性能）

3. **清理无用索引**
   - 定期审查索引使用情况
   - 删除从未使用的索引

---

## 📊 索引配置说明

### 基础索引模式

#### 模式 1: userId + orderBy
```json
{
  "collectionGroup": "sessions",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "DESCENDING" }
  ]
}
```
**支持查询:**
- `where('userId', '==', x).orderBy('date', 'desc')`

#### 模式 2: userId + filter + orderBy
```json
{
  "collectionGroup": "sessions",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "clientName", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "DESCENDING" }
  ]
}
```
**支持查询:**
- `where('userId', '==', x).where('clientName', '==', y).orderBy('date', 'desc')`

#### 模式 3: userId + arrayContains + orderBy
```json
{
  "collectionGroup": "knowledgeBase",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "tags", "arrayConfig": "CONTAINS" },
    { "fieldPath": "updatedAt", "order": "DESCENDING" }
  ]
}
```
**支持查询:**
- `where('userId', '==', x).where('tags', 'array-contains', y).orderBy('updatedAt', 'desc')`

---

## 🛠️ 索引管理工具

### NPM Scripts (package.json 添加)

```json
{
  "scripts": {
    "indexes:generate": "node scripts/generate-indexes.js",
    "indexes:deploy": "firebase deploy --only firestore:indexes",
    "indexes:deploy:prod": "firebase deploy --only firestore:indexes --project production",
    "indexes:list": "firebase firestore:indexes",
    "indexes:delete": "firebase firestore:indexes:delete <index-id>"
  }
}
```

### 使用方法

```bash
# 生成索引配置
npm run indexes:generate

# 部署到开发环境
npm run indexes:deploy

# 部署到生产环境
npm run indexes:deploy:prod

# 查看当前索引
npm run indexes:list

# 删除特定索引
npm run indexes:delete <index-id>
```

---

## 📈 性能优化建议

### 索引策略

1. **按需创建**
   - 不要提前创建所有可能的索引
   - 根据实际查询需求逐步添加

2. **避免过度索引**
   - 每个索引会增加写入成本
   - 平衡查询性能和写入性能

3. **使用复合索引**
   - 一个复合索引可以支持多个查询
   - 例如: `(userId, date DESC)` 也支持 `(userId)` 查询

### 查询优化

1. **限制结果数量**
   ```typescript
   // 使用 limit
   query.limit(100)
   ```

2. **使用分页**
   ```typescript
   // 使用 startAfter 分页
   query.startAfter(lastDoc).limit(20)
   ```

3. **缓存查询结果**
   - 动态查询系统已集成缓存
   - 相同查询会直接返回缓存结果

---

## ⚠️ 常见问题

### Q1: 索引构建需要多久？

**A:** 取决于数据量
- 小型数据库（<1000 条记录）：几秒到几分钟
- 中型数据库（1000-10000 条）：几分钟到半小时
- 大型数据库（>10000 条）：可能需要数小时

### Q2: 索引失败怎么办？

**A:** 检查以下几点
1. 字段名是否正确
2. 数据类型是否匹配
3. 是否有 `undefined` 值（Firestore 不索引 `undefined`）

### Q3: 如何知道索引是否被使用？

**A:** 使用 Firestore 性能监控
```bash
# 在 Firebase Console 查看
# Performance -> Firestore -> Index Usage
```

### Q4: 可以删除索引吗？

**A:** 可以，但要小心
```bash
# 删除特定索引
firebase firestore:indexes:delete <index-id>

# 或从 firestore.indexes.json 移除后重新部署
```

### Q5: 索引会增加多少成本？

**A:** Firestore 索引成本
- **存储**: 每个索引条目约占文档大小的 10-20%
- **写入**: 每次写入会更新所有相关索引（增加写入次数）
- **读取**: 索引本身不增加读取成本

---

## 🚀 快速开始

### 立即配置索引（推荐流程）

```bash
# 步骤 1: 生成索引配置
node scripts/generate-indexes.js

# 步骤 2: 审查生成的配置
cat firestore.indexes.json | less

# 步骤 3: 部署到 Firestore
firebase deploy --only firestore:indexes

# 步骤 4: 监控构建进度
firebase firestore:indexes

# 步骤 5: 测试应用查询
npm run dev
# 访问 AI 助手页面，尝试各种查询
```

### 验证索引是否工作

```bash
# 1. 查看日志，确认没有索引警告
tail -f logs/app.log | grep "可能需要 Firestore 复合索引"

# 2. 测试查询性能
# 在 AI 助手中输入: "获取本月所有课程，按日期倒序"
# 应该在 1-2 秒内返回结果

# 3. 检查 Firebase Console
# https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes
# 确认所有索引状态为 "Enabled"
```

---

## 📚 参考资料

- [Firestore 索引官方文档](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase CLI 索引管理](https://firebase.google.com/docs/cli#commands)
- [索引最佳实践](https://firebase.google.com/docs/firestore/query-data/index-best-practices)

---

## 💡 总结

**关键要点:**
1. ✅ 使用自动生成脚本预创建索引
2. ✅ 启用运行时索引检测（已集成）
3. ✅ 定期审查和优化索引配置
4. ✅ 监控索引使用情况和性能
5. ✅ 平衡查询性能和写入成本

**推荐工作流:**
```
开发 → 生成索引 → 部署索引 → 测试查询 → 监控日志 → 增量优化
```

