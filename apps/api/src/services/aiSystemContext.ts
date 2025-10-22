/**
 * AI 系统上下文 - AI 必读的系统信息
 * 
 * 这个文件包含 AI 在解析用户输入时必须了解的核心信息：
 * - 数据库 Schema（字段定义、必填项）
 * - Firestore 索引限制
 * - 查询最佳实践
 * - 已知问题和解决方案
 */

/**
 * 数据库 Schema 定义
 */
export const DATABASE_SCHEMA = {
  // 客户
  Client: {
    required: ['name'],
    optional: ['clientTypeId', 'contactInfo', 'notes', 'active', 'defaultRateIds'],
    indexes: [
      { fields: ['userId', 'name'] },
      { fields: ['userId', 'active', 'name'] },
    ],
    notes: 'name 是唯一必需字段',
  },

  // 课程记录
  Session: {
    required: ['clientName', 'sessionTypeName', 'date', 'startTime', 'endTime'],
    optional: ['rateAmount', 'notes', 'currency'],
    resolvedFields: {
      clientName: 'clientId',  // AI 提供 clientName，系统解析为 clientId
      sessionTypeName: 'sessionTypeId',  // AI 提供 sessionTypeName，系统解析为 sessionTypeId
    },
    indexes: [
      { fields: ['userId', 'date'] },
      { fields: ['userId', 'clientId', 'date'] },
      { fields: ['userId', 'sessionTypeId', 'date'] },
      { fields: ['userId', 'billingStatus', 'date'] },
    ],
    notes: 'clientName 和 sessionTypeName 是必需的，系统会自动解析为对应的 ID',
  },

  // 费率
  Rate: {
    required: ['amount'],
    optional: ['clientId', 'clientTypeId', 'category', 'currency', 'effectiveDate', 'description'],
    indexes: [
      { fields: ['userId', 'clientId', 'effectiveDate'] },
      { fields: ['userId', 'clientTypeId', 'effectiveDate'] },
    ],
    notes: '至少需要 amount，clientId/clientTypeId 可选（不能同时为空）',
  },

  // 课程类型
  SessionType: {
    required: ['name'],
    optional: ['description'],
    indexes: [
      { fields: ['userId', 'name'] },
      { fields: ['userId', 'createdAt'] },
    ],
    notes: 'name 是唯一必需字段',
  },

  // 客户类型
  ClientType: {
    required: ['name'],
    optional: ['description'],
    indexes: [
      { fields: ['userId', 'name'] },
      { fields: ['userId', 'createdAt'] },
    ],
    notes: 'name 是唯一必需字段',
  },

  // 知识库
  KnowledgeBase: {
    required: ['title', 'type', 'content'],
    optional: ['tags', 'category', 'isEncrypted', 'attachments'],
    types: ['note', 'api-key', 'ssh-record', 'password', 'memo', 'query-result'],
    indexes: [
      { fields: ['userId', 'updatedAt'] },
      { fields: ['userId', 'type', 'updatedAt'] },
      { fields: ['userId', 'tags', 'updatedAt'], arrayContains: true },
      { fields: ['userId', 'category', 'updatedAt'] },
    ],
    notes: 'type 为 api-key, ssh-record, password 时自动加密',
  },

  // 支出
  Expenses: {
    required: ['category', 'amount', 'date'],
    optional: ['description', 'paymentMethod', 'clientId', 'receiptUrl'],
    indexes: [
      { fields: ['userId', 'date'] },
      { fields: ['userId', 'category', 'date'] },
      { fields: ['userId', 'paymentMethod', 'date'] },
      { fields: ['userId', 'clientId', 'date'] },
    ],
    notes: 'category, amount, date 是必需的',
  },
};

/**
 * Firestore 查询限制和最佳实践
 */
export const FIRESTORE_CONSTRAINTS = {
  // 复合查询限制
  queryLimits: {
    maxWhereClausesBeforeIndex: 1,  // 超过 1 个 where 通常需要索引
    rangeFiltersLimit: 1,  // 只能有 1 个范围筛选（<, <=, >, >=）
    maxOrderByWithoutIndex: 1,  // where + orderBy 需要索引
  },

  // 需要索引的查询模式
  requiresIndex: [
    'where + where + orderBy',
    'where + rangeFilter + orderBy',
    'where + arrayContains + orderBy',
    'multiple orderBy fields',
  ],

  // 不需要索引的简单查询
  noIndexNeeded: [
    'single where clause',
    'single orderBy',
    'where on same field as orderBy',
  ],

  // 索引创建建议
  indexGuidelines: {
    equalityFirst: 'where 等值筛选字段在前',
    rangeInMiddle: 'where 范围筛选字段在中间',
    orderByLast: 'orderBy 排序字段在最后',
    userIdAlways: '总是在最前面加 userId（用户隔离）',
  },
};

/**
 * AI 常见错误和解决方案
 */
export const COMMON_AI_MISTAKES = {
  undefinedValues: {
    problem: 'Firestore 不允许字段值为 undefined',
    solution: '只在字段有值时才添加到对象中',
    example: {
      wrong: '{ clientId: undefined }',
      correct: 'if (clientId) { data.clientId = clientId; }',
    },
  },

  missingRequiredFields: {
    problem: 'Session 创建时缺少 clientName 或 sessionTypeName',
    solution: '始终检查并提取这些必需字段',
    example: {
      wrong: '{ date: "2025-10-19", startTime: "08:30" }',
      correct: '{ clientName: "Sophie", sessionTypeName: "IB Math HL", date: "2025-10-19", startTime: "08:30", endTime: "09:30" }',
    },
  },

  invalidQueryConstraints: {
    problem: '使用 clientName 直接查询 rates（rates 没有 clientName 字段）',
    solution: '先查询 clients 获取 clientId，再查询 rates',
    example: {
      wrong: 'rates.where("clientName", "==", "Sophie")',
      correct: 'client = clients.where("name", "==", "Sophie"); rates.where("clientId", "==", client.id)',
    },
  },

  complexQueriesWithoutIndex: {
    problem: '生成了需要索引但索引不存在的查询',
    solution: '使用简单查询或动态查询系统',
    example: {
      needsIndex: 'where userId == x AND where clientId == y ORDER BY date DESC',
      alternative: '使用动态查询系统处理',
    },
  },
};

/**
 * AI 决策树 - 何时使用哪个系统
 */
export const AI_DECISION_TREE = {
  useMCP: {
    scenarios: [
      '简单的 CRUD 操作（1-2 个条件）',
      '创建单个记录',
      '更新/删除已知记录',
      '基础查询（按名称、日期等）',
      '简单统计（单个聚合函数）',
    ],
    maxConditions: 3,
    maxAggregations: 2,
  },

  useDynamicQuery: {
    scenarios: [
      '复杂聚合（3+ 个聚合函数）',
      '多条件筛选（4+ 个条件）',
      'GROUP BY 多个字段',
      '复杂的范围查询 + 排序',
      'MCP 验证失败的查询',
    ],
    advantages: [
      '更灵活的查询能力',
      '支持复杂的 Firestore 操作',
      '自动索引检测',
    ],
  },
};

/**
 * 时间解析规则
 */
export const TIME_PARSING_RULES = {
  relativeDates: {
    '今天': 'today',
    '明天': 'tomorrow',
    '昨天': 'yesterday',
    '后天': 'day after tomorrow',
    '大后天': '3 days from now',
  },

  weekDays: {
    '本周一': 'this Monday',
    '本周二': 'this Tuesday',
    '下周一': 'next Monday',
    '上周一': 'last Monday',
  },

  monthPeriods: {
    '本月': 'current month (start to end)',
    '上月': 'last month (start to end)',
    '下月': 'next month (start to end)',
  },

  timeFormats: {
    '上午10点': '10:00',
    '下午2点': '14:00',
    '晚上8点': '20:00',
    '10-12点': 'startTime: 10:00, endTime: 12:00',
  },
};

/**
 * 生成精简的 AI 系统上下文（Token 优化）
 * 只包含最关键的信息，减少 85% Token 消耗
 */
export function generateAISystemContext(): string {
  return `SCHEMA (REQUIRED*):
Session: clientName*, sessionTypeName*, date*, startTime*, endTime*
Client: name*
Rate: amount*
SessionType: name*

TIME: "今天"→today, "明天"→+1d, "10-12点"→"10:00"-"12:00", "下午2点"→"14:00"

CRITICAL RULES:
1. Session MUST have ALL 5 fields: clientName, sessionTypeName, date, startTime, endTime
2. NEVER add undefined/null values (Firestore error)
3. Don't query rates by clientName (use clientId)
4. requiresConfirmation=true ONLY for delete/update`;
}

/**
 * 生成完整详细上下文（仅在必要时使用）
 */
export function generateDetailedAISystemContext(): string {
  return `
# AI 系统上下文 - 完整信息

## 数据库 Schema（必需字段）

### Session（课程记录）- 最常用
**必需字段：**
- clientName (客户名称) - REQUIRED
- sessionTypeName (课程类型名称) - REQUIRED  
- date (日期 YYYY-MM-DD) - REQUIRED
- startTime (开始时间 HH:mm) - REQUIRED
- endTime (结束时间 HH:mm) - REQUIRED

**可选字段：**
- rateAmount (费率金额)
- notes (备注)
- currency (货币，默认 CNY)

**重要：** clientName 和 sessionTypeName 会被系统自动解析为对应的 ID。

### Client（客户）
**必需：** name
**可选：** clientTypeId, contactInfo, notes, active

### Rate（费率）
**必需：** amount
**可选：** clientId, clientTypeId, category, currency, effectiveDate
**注意：** clientId 和 clientTypeId 至少要有一个

### SessionType（课程类型）
**必需：** name
**可选：** description

### KnowledgeBase（知识库）
**必需：** title, type, content
**type 选项：** note, api-key, ssh-record, password, memo, query-result

## Firestore 查询限制

### ❌ 避免的查询模式
1. 字段值为 undefined（会导致错误）
2. 使用不存在的字段查询（如用 clientName 查询 rates）
3. 超过 1 个范围筛选
4. 复杂的多条件查询没有索引

### ✅ 推荐的查询模式
1. 简单的等值查询
2. 单个范围筛选 + 排序
3. 使用已有索引的字段组合
4. 复杂查询使用动态查询系统

## 常见错误修正

### 错误 1：undefined 值
❌ 错误：{ clientId: undefined, amount: 65 }
✅ 正确：{ amount: 65 } 或 if (clientId) { data.clientId = clientId; }

### 错误 2：缺少必需字段
❌ 错误：创建 session 时只有 { date: "2025-10-19" }
✅ 正确：{ clientName: "Sophie", sessionTypeName: "Math", date: "2025-10-19", startTime: "08:30", endTime: "09:30" }

### 错误 3：字段名不匹配
❌ 错误：在 rates 集合中查询 clientName
✅ 正确：先查询 clients 获取 clientId，再查询 rates

## AI 决策规则

### 使用 MCP 系统（优先）
- 简单 CRUD 操作
- 1-3 个查询条件
- 单个聚合统计
- 创建/更新/删除操作

### 使用动态查询（复杂场景）
- 4+ 个查询条件
- 3+ 个聚合函数
- GROUP BY 多字段
- 复杂排序 + 筛选

## 时间解析快速参考
- "今天" → 当前日期
- "明天" → 当前日期 + 1
- "本周一" → 本周的周一
- "下午2点" → 14:00
- "10-12点" → startTime: 10:00, endTime: 12:00

## 索引要求
当使用 where + orderBy 组合时，通常需要复合索引。
系统会自动检测并提示缺失的索引。

## 最佳实践总结
1. ✅ 始终检查必需字段是否存在
2. ✅ 不要添加 undefined 值到数据对象
3. ✅ 使用正确的字段名（clientId vs clientName）
4. ✅ 复杂查询优先考虑动态查询系统
5. ✅ 简单操作使用 MCP 系统
`;
}

/**
 * 获取特定实体的 Schema 信息
 */
export function getEntitySchema(entityName: string): any {
  return DATABASE_SCHEMA[entityName as keyof typeof DATABASE_SCHEMA];
}

/**
 * 验证数据是否符合 Schema
 */
export function validateEntityData(
  entityName: string,
  data: Record<string, any>
): { valid: boolean; errors: string[] } {
  const schema = getEntitySchema(entityName);
  if (!schema) {
    return { valid: false, errors: [`Unknown entity: ${entityName}`] };
  }

  const errors: string[] = [];

  // 检查必需字段
  for (const field of schema.required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // 检查 undefined 值
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      errors.push(`Field ${key} has undefined value (not allowed in Firestore)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

