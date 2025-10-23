# 🚀 动态查询系统 - AI 智能数据库查询

## 概述

新的**动态查询系统**允许用户使用自然语言直接与数据库交互，Gemini AI 会自动生成和执行对应的 Firestore 查询。

### 核心差异

| 方面 | 旧系统 (MCP) | 新系统 (动态查询) |
|-----|-----------|-------------|
| **查询方式** | 固定的预定义命令树 | 动态生成 Firestore 查询代码 |
| **灵活性** | 受限（只支持预定义的操作） | 高度灵活（任意复杂的查询） |
| **用户体验** | 需要理解系统的 schema | 完全自然语言 |
| **示例** | "显示 Alex 的课程" | "显示 Alex 在本月所有 cello 课程中收费最高的前 3 个" |

---

## 功能说明

### 1️⃣ 支持的操作

#### ✅ 查询 (Query)
```
用户: "获取本周所有课程，按日期倒序"
↓ AI 生成:
{
  "type": "query",
  "collection": "sessions",
  "filters": [
    {"field": "date", "operator": ">=", "value": "2025-10-20"},
    {"field": "date", "operator": "<=", "value": "2025-10-26"}
  ],
  "orderBy": [{"field": "date", "direction": "desc"}]
}
↓ 执行
结果: [session1, session2, ...]
```

#### ✅ 创建 (Create)
```
用户: "为 Alex 创建一个新课程，今天下午 2 点到 4 点，cello，费用 100 元"
↓ AI 生成:
{
  "type": "create",
  "collection": "sessions",
  "data": {
    "clientName": "Alex",
    "date": "2025-10-22",
    "startTime": "14:00",
    "endTime": "16:00",
    "sessionTypeName": "cello",
    "totalAmount": 100
  }
}
↓ 执行
结果: {id: "doc123", ...}
```

#### ✅ 统计聚合 (Aggregate)
```
用户: "统计每个客户的课程总金额和课程数量"
↓ AI 生成:
{
  "type": "aggregate",
  "collection": "sessions",
  "groupBy": ["clientName"],
  "aggregations": [
    {"type": "sum", "field": "totalAmount"},
    {"type": "count", "field": "id"}
  ]
}
↓ 执行
结果: {
  "sum(totalAmount)_Alex": 500,
  "count(id)_Alex": 5,
  "sum(totalAmount)_Bob": 300,
  "count(id)_Bob": 3
}
```

---

## API 端点

### 1. 执行动态查询

**端点:** `POST /api/trpc/dynamicQuery.execute`

**请求:**
```typescript
{
  "prompt": "获取 Alex 本月所有课程"
}
```

**响应:**
```typescript
{
  "success": true,
  "explanation": "查询 Alex 在 2025 年 10 月的所有课程记录",
  "results": [
    {
      "operationIndex": 0,
      "type": "query",
      "collection": "sessions",
      "resultCount": 5,
      "data": [
        {
          "id": "doc1",
          "clientName": "Alex",
          "date": "2025-10-22",
          "sessionTypeName": "cello",
          "totalAmount": 100,
          ...
        }
      ]
    }
  ]
}
```

### 2. 仅生成查询（预览模式）

**端点:** `GET /api/trpc/dynamicQuery.generate`

**请求:**
```typescript
{
  "prompt": "显示本周所有课程"
}
```

**响应:**
```typescript
{
  "success": true,
  "explanation": "查询 2025-10-20 到 2025-10-26 的所有课程",
  "operations": [
    {
      "type": "query",
      "collection": "sessions",
      "filters": [...],
      "orderBy": [...]
    }
  ]
}
```

---

## 前端集成示例

### React Hook 用法

```typescript
import { trpc } from '@/utils/trpc';

export function DynamicQueryPage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  
  // 执行查询
  const executeMutation = trpc.dynamicQuery.execute.useMutation();
  
  const handleExecute = async () => {
    const res = await executeMutation.mutateAsync({ prompt });
    setResult(res);
  };

  return (
    <div>
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="输入你的查询..."
      />
      <button onClick={handleExecute}>
        执行查询
      </button>

      {result?.success && (
        <div>
          <p>说明: {result.explanation}</p>
          <pre>{JSON.stringify(result.results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## 支持的集合和字段

### Collections 支持列表

| 集合 | 描述 | 关键字段 |
|-----|------|--------|
| **sessions** | 课程记录 | clientName, date, startTime, endTime, sessionTypeName, totalAmount |
| **clients** | 客户 | name, clientTypeId, contactInfo, notes, createdAt |
| **rates** | 费率 | clientId, clientTypeId, category, amount, currency, effectiveDate |
| **sessionTypes** | 课程类型 | name, description |
| **clientTypes** | 客户类型 | name, description |
| **knowledgeBase** | 知识库 | userId, title, type, content, tags, category, isEncrypted |
| **expenses** | 支出 | userId, category, amount, date, description |

### 时间操作符

- `date >= "2025-10-20"` - 日期大于等于
- `date < "2025-10-31"` - 日期小于
- `amount > 100` - 金额大于

### 聚合函数

- `count` - 计数
- `sum` - 求和
- `avg` - 平均值
- `min` - 最小值
- `max` - 最大值

---

## 使用示例

### 示例 1: 简单查询
```
用户提示: "显示所有客户"
生成的查询:
{
  "type": "query",
  "collection": "clients"
}
```

### 示例 2: 带条件的查询
```
用户提示: "获取金额超过 100 元的费率"
生成的查询:
{
  "type": "query",
  "collection": "rates",
  "filters": [
    {"field": "amount", "operator": ">", "value": 100}
  ]
}
```

### 示例 3: 排序和限制
```
用户提示: "获取最新的 5 个课程"
生成的查询:
{
  "type": "query",
  "collection": "sessions",
  "orderBy": [
    {"field": "date", "direction": "desc"}
  ],
  "limit": 5
}
```

### 示例 4: 复杂聚合
```
用户提示: "按客户统计本月的课程总金额"
生成的查询:
{
  "type": "aggregate",
  "collection": "sessions",
  "filters": [
    {"field": "date", "operator": ">=", "value": "2025-10-01"},
    {"field": "date", "operator": "<=", "value": "2025-10-31"}
  ],
  "groupBy": ["clientName"],
  "aggregations": [
    {"type": "sum", "field": "totalAmount"}
  ]
}
```

### 示例 5: 创建新记录
```
用户提示: "为客户 Bob 添加一个新费率，金额 150 元"
生成的查询:
{
  "type": "create",
  "collection": "rates",
  "data": {
    "clientName": "Bob",
    "amount": 150
  }
}
```

---

## 安全特性

### 🔒 内置安全措施

1. **白名单集合验证**
   - 只允许访问预定义的 7 个集合
   - 防止访问系统集合

2. **用户隔离**
   - 自动为用户相关集合添加 `userId` 筛选
   - knowledgeBase 和 expenses 自动隔离到当前用户

3. **操作符限制**
   - 只支持 8 个安全的操作符：`<`, `<=`, `==`, `>=`, `>`, `!=`, `in`, `array-contains`
   - 防止注入攻击

4. **创建操作保护**
   - 自动添加 `userId`, `createdAt`, `updatedAt` 元数据
   - 防止无授权创建

---

## 错误处理

### 常见错误和解决方案

| 错误 | 原因 | 解决方案 |
|-----|------|--------|
| `Collection "xxx" is not allowed` | 访问了非白名单集合 | 检查集合名是否正确 |
| `Create operation requires "data" field` | 创建操作缺少数据 | 确保提供了要创建的数据 |
| `Failed to generate query` | Gemini AI 无法理解提示 | 用更清晰的自然语言重新表述 |
| `Request timeout` | 查询执行超时 | 尝试限制结果数量或简化查询 |

---

## 性能优化

### 缓存支持

动态查询系统继承了优化的缓存层：
- **L1 内存缓存**: 5 分钟 TTL
- **L2 Firestore 缓存**: 1 天 TTL
- 相同查询会自动返回缓存结果

### 查询优化建议

1. **使用 limit** - 大量数据时限制返回条数
   ```
   "获取最新的 10 个课程"（而不是"获取所有课程"）
   ```

2. **缩小日期范围** - 避免扫描整个集合
   ```
   "获取本月的课程"（而不是"获取所有课程"）
   ```

3. **针对性的 groupBy** - 聚合前先筛选
   ```
   "统计本周每个客户的课程总金额"（而不是"统计所有客户"）
   ```

---

## 与旧系统的对比

### 旧系统 (MCP 方案)
```
用户: "Hubery 的课程"
↓
固定 schema 解析
↓
预定义的 MCP 命令
↓
executeWorkflow()
```

### 新系统 (动态查询)
```
用户: "Hubery 在本月所有 cello 课程中最贵的是多少钱"
↓
Gemini 生成 Firestore 查询代码
↓
直接执行查询 (where, orderBy, aggregations)
↓
返回精确结果
```

**关键优势:**
- ✅ 支持任意复杂的查询逻辑
- ✅ 自然语言更自由
- ✅ 响应速度更快（直接 Firestore 查询，无需中间转换）
- ✅ 聚合能力更强大

---

## 架构图

```
┌─────────────────────┐
│   用户自然语言提示    │
│ "获取 Alex 的课程"  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│  Gemini AI 查询生成器        │
│  (dynamicQueryGenerator)     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  查询操作 JSON               │
│  {type, collection, filters}│
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  查询执行引擎               │
│  (executeQuery/Create/etc)  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Firestore 数据库           │
│  (真实执行)                  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  结果返回给用户              │
│  (JSON + 说明文本)          │
└─────────────────────────────┘
```

---

## 部署检查清单

- [ ] 编译无错误: `npm run build`
- [ ] 新路由已注册到 `appRouter`
- [ ] GEMINI_API_KEY 已配置
- [ ] Firestore 权限已设置
- [ ] 前端已集成新的 tRPC 端点
- [ ] 测试几个查询用例
- [ ] 监控性能指标

---

## 常见问题

**Q: 动态查询会替代旧的 AI 系统吗?**
A: 不会。两个系统可以并行运行。新系统用于高级查询，旧系统继续处理其他 AI 功能。

**Q: 如何防止 SQL 注入风险?**
A: Firestore 原生防止注入攻击，因为查询是通过 API 构建而非字符串拼接。

**Q: 支持跨集合 JOIN 吗?**
A: 不直接支持。可以通过多个操作来实现（先查询主集合，再根据结果查询关联集合）。

**Q: 聚合操作是否支持子查询?**
A: 目前支持基础聚合。复杂的多级聚合可以通过多个操作顺序执行。

---

## 未来改进方向

- [ ] 支持自定义聚合函数
- [ ] JOIN 操作支持
- [ ] 事务支持（多操作原子性）
- [ ] 更复杂的时间表达式 ("最近 7 天", "季度末" 等)
- [ ] 结果导出 (CSV, Excel)
- [ ] 查询执行计划可视化
