# 实现细节 - AI 改进代码变更

## 文件修改清单

### 1. 类型系统扩展
**文件**: `packages/shared/src/types/mcp.ts`
- 添加 'knowledgeBase' 到 MCPEntity 类型
- 支持所有MCP命令（create, read, update, delete, search）应用于知识库

```typescript
export type MCPEntity = 
  | 'client' 
  | 'session' 
  | 'rate' 
  | 'invoice' 
  | 'sessionType' 
  | 'clientType'
  | 'expense'
  | 'expenseCategory'
  | 'knowledgeBase';  // ← 新增
```

---

### 2. Router Schema 更新
**文件**: `apps/api/src/routers/ai.ts`

修改 ExecuteInputSchema 支持 knowledgeBase 实体：
```typescript
entity: z.enum([
  'client', 'session', 'rate', 'invoice', 'sessionType', 
  'clientType', 'expense', 'expenseCategory', 
  'knowledgeBase'  // ← 新增
])
```

---

### 3. AI Service - System Prompt 扩展
**文件**: `apps/api/src/services/aiService.ts`

#### 添加 KnowledgeBase Schema
```
5. **KnowledgeBase** (知识库)
   - title: string (required)
   - type: string (enum: 'note', 'api-key', 'ssh-record', 'password', 'memo')
   - content: string (required)
   - tags: string[] (optional)
   - category: string (optional)
   - requireEncryption: boolean (auto-set for sensitive types)
```

#### 增强的时间解析规则
- 日期: "后天"、"昨天"、"本周一/二..."、"下周..."、"上周..."、"本月"、"上月"、"下月"、"本周"、"上周"、"下周"、"N天后"
- 时间: "上午10点"、"早上10点"、"下午2点"、"晚上7点"、"中午12点"

#### 新增示例
5个示例展示了更好的session查询和knowledgeBase操作

---

### 4. MCP Executor - 核心业务逻辑
**文件**: `apps/api/src/services/mcpExecutor.ts`

#### A. Bug 修复 - executeWorkflow
```typescript
// 从
return {
  success: true,
  data: results,  // [{success, data, ...}, ...]
  affectedRecords,
};

// 改为
return {
  success: true,
  data: results.map(r => r.data),  // [data, data, ...]
  affectedRecords,
};
```

#### B. createEntity - 添加 KnowledgeBase 支持
```typescript
case 'knowledgeBase':
  // 自动检测敏感类型
  const sensitiveTypes = ['api-key', 'ssh-record', 'password'];
  const shouldEncrypt = data?.requireEncryption || 
                        sensitiveTypes.includes(data?.type);
  
  entityData = {
    userId,
    title: data?.title || '',
    type: data?.type || 'note',
    content: data?.content || '',
    requireEncryption: shouldEncrypt,  // ← 自动加密标记
    tags: data?.tags || [],
    category: data?.category,
    attachments: [],
    accessCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    createdByAI: true,      // ← AI标记
    aiGeneratedAt: now,     // ← 创建时间
  };
  break;
```

#### C. searchEntity - 增强搜索功能

**新增功能**:
1. KnowledgeBase type 筛选
2. KnowledgeBase tags 筛选
3. KnowledgeBase category 筛选
4. Timestamp 序列化处理 (将 Firestore Timestamps 转换为 ISO 字符串)
5. 加密内容隐藏 (搜索结果不返回解密的敏感内容)

```typescript
// Handle knowledgeBase type filter
if (entity === 'knowledgeBase' && conditions.type) {
  query = query.where('type', '==', conditions.type);
}

// Handle knowledgeBase tags filter
if (entity === 'knowledgeBase' && conditions.tags && conditions.tags.length > 0) {
  query = query.where('tags', 'array-contains', conditions.tags[0]);
}

// Handle knowledgeBase category filter
if (entity === 'knowledgeBase' && conditions.category) {
  query = query.where('category', '==', conditions.category);
}

// Timestamp 序列化
if (data.date && typeof data.date.toDate === 'function') {
  item.date = data.date.toDate().toISOString();
}

// 隐藏加密内容
if (entity === 'knowledgeBase' && data.isEncrypted) {
  item.content = '[ENCRYPTED]';
}
```

#### D. getCollectionName - 映射新实体
```typescript
knowledgeBase: 'knowledgeBase',  // ← 新增
```

---

### 5. 前端 - 查询结果显示修复
**文件**: `apps/web/src/components/AIAssistant.tsx`

#### A. Bug 修复 - 查询结果解析
```typescript
// 改进的解析逻辑支持:
// 1. 数组的数组格式: [[records], [records], ...]
// 2. 直接的结果对象数组: [record, record, ...]
// 3. KnowledgeBase 条目识别 (通过 title 字段)

const firstItem = result.data[0];

if (Array.isArray(firstItem)) {
  // 第一个命令返回的是数组（查询结果）
  const records = firstItem;
} else if (firstItem && typeof firstItem === 'object' && 
           (firstItem.clientName || firstItem.date || firstItem.title)) {
  // 直接是结果对象数组
  const records = result.data;
}
```

#### B. 改进的结果显示
- 支持 Session 显示: clientName, date, startTime, endTime, totalAmount
- 支持 KnowledgeBase 显示: title（新增）
- 分页显示（最多5条，超过部分显示"还有N条"）

#### C. 更新示例提示
添加 KnowledgeBase 操作示例：
- "保存一个API密钥，标题OpenAI Key，内容sk-xxx"
- "查找所有SSH相关的记录"

---

## 数据流图

### Session 查询流程
```
用户输入: "显示Hubery的所有课程"
         ↓
AI Service (aiService.ts)
  - 识别操作: search
  - 识别实体: session
  - 生成条件: { clientName: "Hubery" }
         ↓
MCP Executor (mcpExecutor.ts)
  - 搜索客户: Hubery → clientId: "abc123"
  - 查询 sessions.where('clientId', '==', 'abc123')
  - 格式化结果（Timestamps → ISO strings）
         ↓
返回数据: [session1, session2, ...]
         ↓
前端 (AIAssistant.tsx)
  - 识别结果是数组
  - 格式化显示: "查询成功，找到 N 条记录"
  - 显示每条记录摘要
```

### KnowledgeBase 创建流程
```
用户输入: "保存一个API密钥，标题OpenAI Key，内容sk-test123"
         ↓
AI Service (aiService.ts)
  - 识别操作: create
  - 识别实体: knowledgeBase
  - 识别类型: api-key
  - 生成数据: {
      title: "OpenAI Key",
      type: "api-key",
      content: "sk-test123",
      requireEncryption: true
    }
         ↓
MCP Executor (mcpExecutor.ts)
  - 检测敏感类型: api-key ✓
  - 设置加密标记: requireEncryption: true
  - 添加AI标记: createdByAI: true, aiGeneratedAt: now
  - 调用 db.collection('knowledgeBase').add({...})
         ↓
KnowledgeBase Router (knowledgeBase.ts)
  - 触发加密逻辑（encryptionService）
  - 保存加密的内容
         ↓
返回创建结果
         ↓
前端 (AIAssistant.tsx)
  - 显示: "✅ 操作成功完成"
  - 显示: "创建了 knowledgeBase: id"
```

### KnowledgeBase 搜索流程
```
用户输入: "查找所有API密钥"
         ↓
AI Service (aiService.ts)
  - 识别操作: search
  - 识别实体: knowledgeBase
  - 生成条件: { type: "api-key" }
         ↓
MCP Executor (mcpExecutor.ts)
  - 查询: knowledgeBase.where('type', '==', 'api-key')
  - 隐藏加密内容: content: '[ENCRYPTED]'
  - 返回元数据和加密状态
         ↓
返回数据: [
  { id, title, type, content: '[ENCRYPTED]', tags, ... },
  { id, title, type, content: '[ENCRYPTED]', tags, ... },
  ...
]
         ↓
前端 (AIAssistant.tsx)
  - 识别结果是对象数组
  - 格式化显示: "查询成功，找到 N 条记录"
  - 显示: "1. OpenAI Key"
```

---

## 关键设计决策

### 1. 为什么修改 executeWorkflow 返回格式？
- **原因**: 前端期望扁平的数据数组，不是嵌套的结果对象
- **好处**: 简化前端解析逻辑，减少冗余数据传输
- **兼容性**: 后端已经完整保存所有执行结果，只是调整返回格式

### 2. 为什么在 MCP Executor 处理 KnowledgeBase 的加密？
- **原因**: MCP Executor 知道数据类型，可以自动检测敏感类型
- **好处**: AI Service 不需要关心加密细节，业务逻辑分离清楚
- **流程**: MCP Executor 设置 requireEncryption 标记 → Router 实际执行加密

### 3. 为什么搜索结果隐藏加密内容？
- **原因**: 安全性 - 不在搜索列表中暴露敏感数据
- **行为**: 搜索结果只显示 '[ENCRYPTED]'，用户需要显式打开条目才能解密
- **对标**: 大多数密码管理器的做法

### 4. 为什么添加 createdByAI 和 aiGeneratedAt 标记？
- **原因**: 审计追踪 - 便于追踪哪些记录是AI创建的
- **好处**: 可以在UI中显示不同的图标/标记，便于用户识别
- **扩展**: 便于后续添加"由AI创建的记录"过滤功能

---

## 测试关键点

### Unit Test 建议
1. **时间解析**: 测试各种中文时间表达是否正确解析
2. **搜索条件**: 测试 clientName 到 clientId 的转换是否正确
3. **加密检测**: 测试敏感类型是否正确识别为需加密
4. **Timestamp 序列化**: 测试 Firestore Timestamps 是否正确转换为 ISO 字符串

### Integration Test 建议
1. "显示Hubery的所有课程" - 应显示列表
2. "保存一个API密钥，..." - 应自动加密
3. "查找所有API密钥" - 应显示加密状态
4. 边界情况: 空结果、大量结果、特殊字符等

---

## 后续改进空间

1. **缓存优化**: 频繁的客户名 → ID 查询可以缓存
2. **错误处理**: 更详细的错误消息（如哪个条件未找到）
3. **日志**: 添加 AI 操作的详细审计日志
4. **性能**: 对大量数据的 session 查询添加索引
5. **功能**: 支持 update/delete knowledgeBase（目前只实现了 create/search）
