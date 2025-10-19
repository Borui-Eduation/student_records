/**
 * AI Service - Natural Language Processing using Google Gemini
 * Parses user input and converts it to structured MCP commands
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '@student-record/shared';
import type { MCPParseResult, MCPWorkflow, MCPContext } from '@student-record/shared';

const logger = createLogger('ai-service');

// Initialize Gemini API
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * System prompt that defines the database schema and parsing rules
 */
function getSystemPrompt(): string {
  return `You are an AI assistant for a student record management system. Your job is to parse natural language commands into structured database operations.

**Database Schema:**

1. **Client** (客户)
   - name: string (required)
   - clientTypeId: string (optional, references clientType)
   - contactInfo: { email?, phone?, address? }
   - notes: string

2. **Session** (课时记录)
   - clientId: string (required, can be client name)
   - date: YYYY-MM-DD format
   - startTime: HH:mm format (24-hour)
   - endTime: HH:mm format (24-hour)
   - sessionTypeId: string (required, can be session type name like "cello", "piano")
   - notes: string

3. **Rate** (费率)
   - clientId: string (optional, for client-specific rate)
   - clientTypeId: string (optional, for client type rate)
   - category: string (e.g., "Tutoring", "Music Lesson")
   - amount: number (required)
   - currency: string (default: "CNY")
   - effectiveDate: YYYY-MM-DD

4. **SessionType** (课程类型)
   - name: string (e.g., "cello", "piano", "violin")
   - description: string

5. **KnowledgeBase** (知识库)
   - title: string (required)
   - type: string (required, enum: 'note', 'api-key', 'ssh-record', 'password', 'memo')
   - content: string (required)
   - tags: string[] (optional)
   - category: string (optional)
   - requireEncryption: boolean (auto-set to true for types: 'api-key', 'ssh-record', 'password')

**Operation Types:**
- create: Create new record
- read/search: Query existing records
- update: Modify existing record
- delete: Remove record

**Time Parsing Rules - COMPREHENSIVE:**

Date Expressions:
- "今天" / "today" → current date
- "明天" / "tomorrow" → current date + 1 day
- "后天" → current date + 2 days
- "昨天" / "yesterday" → current date - 1 day
- "本周一/二/三..." → current week's Monday/Tuesday/Wednesday... (if not past)
- "下周一/二..." → next week's Monday/Tuesday...
- "上周一/二..." → last week's Monday/Tuesday...
- "本月" → entire current month (start: YYYY-MM-01, end: YYYY-MM-last-day)
- "上月" → entire last month
- "下月" → entire next month
- "本周" → current week (Monday to Sunday)
- "上周" → last week
- "下周" → next week
- "N天后" → current date + N days

Time Expressions:
- "10-12点" / "10:00-12:00" → startTime: "10:00", endTime: "12:00"
- "上午10点" / "早上10点" → "10:00"
- "下午2点" → "14:00"
- "晚上7点" → "19:00"
- "中午12点" → "12:00"

**Parsing Instructions:**
1. Parse the user's natural language input
2. Identify the operation (create, read, update, delete, search, aggregate)
3. Identify the entities involved (client, session, rate, knowledgeBase, etc.)
4. Extract all relevant data fields
5. For search operations on sessions: include dateRange if temporal keywords present
6. For knowledgeBase operations: automatically handle encryption for sensitive types
7. **For session queries with client names**: ALWAYS include "clientName" in conditions (e.g., "alex的课程" → conditions: {"clientName": "alex"})
8. **For aggregate queries**: Detect keywords like "total", "sum", "average", "how many", "count", "统计", "合计", "平均", "多少" 
   - Use "aggregate" operation with aggregations array
   - Common patterns: "alex的total" → search alex's sessions then sum totalAmount
9. Return a JSON object with the following structure:

{
  "commands": [
    {
      "operation": "create|read|update|delete|search|aggregate",
      "entity": "client|session|rate|sessionType|clientType|knowledgeBase",
      "data": { /* extracted data */ },
      "conditions": { /* search/update conditions */ },
      "aggregations": [ /* for aggregate operations */ { "function": "sum|count|avg|min|max", "field": "fieldName" } ],
      "metadata": {
        "confidence": 0.95,
        "warnings": []
      }
    }
  ],
  "description": "Human-readable description of what will happen",
  "requiresConfirmation": true
}

**Important Rules:**
1. If a client doesn't exist, include a command to create it first
2. If a sessionType doesn't exist, include a command to create it
3. If a rate is specified and doesn't exist, include a command to create it
4. Commands should be ordered logically (create dependencies first)
5. Always use "search" operation before "create" to check existence
6. Set "requiresConfirmation" to true ONLY for destructive operations (delete, update operations)
7. Set "requiresConfirmation" to false for read/search and create operations
8. For session queries: if no specific customer name given but relative time mentioned, search by dateRange only
9. For session queries: "客户名的课程" should search by both clientName and include any other conditions
10. For knowledgeBase: type 'api-key', 'ssh-record', 'password' MUST set requireEncryption: true
11. For knowledgeBase searches: search by type, tags, or title pattern matching

**Session Query Examples:**

Example: "Hubery的课程记录"
- Search for all sessions where clientName = "Hubery"
- No time constraint, return all records

Example: "本月所有cello课程"  
- Search for sessions with sessionTypeName = "cello"
- dateRange from 2025-10-01 to 2025-10-31 (current month)

Example: "下周David的piano课程"
- Search for sessions with clientName = "David" and sessionTypeName = "piano"
- dateRange for next week

**Example 1:**
Input: "帮我添加一个Hubery，今天10-12点，cello课程，rate 80"
Output:
{
  "commands": [
    {
      "operation": "search",
      "entity": "client",
      "data": {},
      "conditions": { "name": "Hubery" }
    },
    {
      "operation": "search",
      "entity": "sessionType",
      "data": {},
      "conditions": { "name": "cello" }
    },
    {
      "operation": "search",
      "entity": "rate",
      "data": {},
      "conditions": { "clientName": "Hubery", "amount": 80 }
    },
    {
      "operation": "create",
      "entity": "session",
      "data": {
        "clientName": "Hubery",
        "sessionTypeName": "cello",
        "date": "2025-10-19",
        "startTime": "10:00",
        "endTime": "12:00",
        "rateAmount": 80
      }
    }
  ],
  "description": "将为客户Hubery创建今天10:00-12:00的cello课程记录，费率为80元/小时。如果客户、课程类型或费率不存在，将自动创建。",
  "requiresConfirmation": false
}

**Example 2:**
Input: "显示Hubery的所有课程"
Output:
{
  "commands": [
    {
      "operation": "search",
      "entity": "session",
      "data": {},
      "conditions": { "clientName": "Hubery" }
    }
  ],
  "description": "查询客户Hubery的所有课程记录",
  "requiresConfirmation": false
}

**Example 3:**
Input: "显示本月所有cello课程"
Output:
{
  "commands": [
    {
      "operation": "search",
      "entity": "session",
      "data": {},
      "conditions": {
        "sessionTypeName": "cello",
        "dateRange": {
          "start": "2025-10-01",
          "end": "2025-10-31"
        }
      }
    }
  ],
  "description": "查询本月(2025年10月)所有cello课程记录",
  "requiresConfirmation": false
}

**Example 4 - KnowledgeBase:**
Input: "保存一个API密钥，标题OpenAI Key，内容sk-test123"
Output:
{
  "commands": [
    {
      "operation": "create",
      "entity": "knowledgeBase",
      "data": {
        "title": "OpenAI Key",
        "type": "api-key",
        "content": "sk-test123",
        "requireEncryption": true,
        "tags": ["api-key", "openai"]
      }
    }
  ],
  "description": "创建一个API密钥知识库条目，标题为'OpenAI Key'，内容将自动加密保存",
  "requiresConfirmation": false
}

**Example 5 - KnowledgeBase Search:**
Input: "查找所有API密钥"
Output:
{
  "commands": [
    {
      "operation": "search",
      "entity": "knowledgeBase",
      "data": {},
      "conditions": {
        "type": "api-key"
      }
    }
  ],
  "description": "查询所有类型为'api-key'的知识库条目",
  "requiresConfirmation": false
}

**Example 6 - Aggregate Query:**
Input: "算一下alex的total"
Output:
{
  "commands": [
    {
      "operation": "aggregate",
      "entity": "session",
      "data": {},
      "conditions": { "clientName": "alex" },
      "aggregations": [
        { "function": "sum", "field": "totalAmount" },
        { "function": "count", "field": "id" }
      ]
    }
  ],
  "description": "计算客户alex所有课程的总金额和课程数量",
  "requiresConfirmation": false
}

Return ONLY the JSON object, no additional text.`;
}

/**
 * Parse natural language input into MCP commands
 */
export async function parseNaturalLanguage(
  input: string,
  context?: MCPContext
): Promise<MCPParseResult> {
  try {
    logger.info('Parsing natural language input', { inputLength: input.length });

    const client = getGeminiClient();
    // 使用官方推荐的免费模型 gemini-2.5-flash
    // https://ai.google.dev/gemini-api/docs/pricing
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build the prompt with context
    const systemPrompt = getSystemPrompt();
    const contextInfo = context ? `\n\n**Current Context:**\n- Current Date: ${context.currentDate}\n- User Timezone: ${context.userPreferences?.timezone || 'Asia/Shanghai'}\n- Default Currency: ${context.userPreferences?.defaultCurrency || 'CNY'}` : '';
    
    const fullPrompt = `${systemPrompt}${contextInfo}\n\n**User Input:**\n${input}\n\n**Your Response (JSON only):**`;

    // Call Gemini API
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    logger.debug('Gemini API response received', { responseLength: text.length });

    // Parse the JSON response
    // Remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.substring(0, jsonText.length - 3);
    }
    jsonText = jsonText.trim();

    const workflow: MCPWorkflow = JSON.parse(jsonText);

    // Add original input to metadata
    workflow.commands = workflow.commands.map(cmd => ({
      ...cmd,
      metadata: {
        ...cmd.metadata,
        originalInput: input,
      },
    }));

    logger.info('Successfully parsed natural language', {
      commandCount: workflow.commands.length,
      requiresConfirmation: workflow.requiresConfirmation,
    });

    return {
      success: true,
      workflow,
    };
  } catch (error) {
    logger.error('Failed to parse natural language', error instanceof Error ? error : new Error(String(error)));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      suggestions: [
        '请尝试更明确地描述您想要执行的操作',
        '确保包含必要的信息（客户名称、时间、课程类型等）',
        '使用简单直接的语言',
      ],
    };
  }
}

/**
 * Validate a parsed workflow before execution
 */
export function validateWorkflow(workflow: MCPWorkflow): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!workflow.commands || workflow.commands.length === 0) {
    errors.push('工作流中没有命令');
  }

  workflow.commands.forEach((cmd, index) => {
    // Validate operation
    const validOperations = ['create', 'read', 'update', 'delete', 'search', 'aggregate'];
    if (!validOperations.includes(cmd.operation)) {
      errors.push(`命令 ${index + 1}: 无效的操作类型 "${cmd.operation}"`);
    }

    // Validate entity
    const validEntities = ['client', 'session', 'rate', 'invoice', 'sessionType', 'clientType', 'expense', 'expenseCategory', 'knowledgeBase'];
    if (!validEntities.includes(cmd.entity)) {
      errors.push(`命令 ${index + 1}: 无效的实体类型 "${cmd.entity}"`);
    }

    // Validate data for create/update operations
    if ((cmd.operation === 'create' || cmd.operation === 'update') && !cmd.data) {
      errors.push(`命令 ${index + 1}: ${cmd.operation} 操作需要 data 字段`);
    }

    // Validate conditions for update/delete operations
    if ((cmd.operation === 'update' || cmd.operation === 'delete') && !cmd.conditions) {
      errors.push(`命令 ${index + 1}: ${cmd.operation} 操作通常需要 conditions 字段`);
    }

    // Validate aggregations for aggregate operations
    if (cmd.operation === 'aggregate' && (!cmd.aggregations || cmd.aggregations.length === 0)) {
      errors.push(`命令 ${index + 1}: aggregate 操作需要 aggregations 字段`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate suggestions based on user context
 */
export async function generateSuggestions(context: MCPContext): Promise<string[]> {
  // For now, return static suggestions based on recent commands
  // Can be enhanced with AI later
  const suggestions = [
    '添加新的课时记录',
    '查询本月的课程统计',
    '更新客户信息',
    '创建新的费率',
  ];

  // Add context-based suggestions
  if (context.recentCommands.length > 0) {
    const lastCommand = context.recentCommands[0];
    if (lastCommand.workflow.commands.some(cmd => cmd.entity === 'client')) {
      suggestions.push('为该客户添加课时记录');
    }
  }

  return suggestions;
}

/**
 * Generate natural language response from aggregation results
 */
export function generateAggregateResponse(
  _userInput: string,
  aggregationData: any,
  _entity: string,
  conditions?: Record<string, any>
): string {
  if (!aggregationData || !aggregationData.aggregations) {
    return '无法生成响应';
  }

  const { count, aggregations } = aggregationData;
  let response = '';

  // 根据查询条件构建响应
  if (conditions?.clientName) {
    response += `客户 ${conditions.clientName} `;
  }

  // 添加记录计数
  if (count === 0) {
    response += '没有找到任何记录';
    return response;
  }

  response += `共有 ${count} 条记录。`;

  // 添加聚合结果
  const resultParts: string[] = [];
  for (const agg of aggregations) {
    const { function: func, field, result } = agg;
    
    if (result === null || result === undefined) {
      continue;
    }

    // 格式化字段名为可读的中文
    const fieldNames: Record<string, string> = {
      totalAmount: '总金额',
      amount: '金额',
      durationHours: '总时长',
      id: '数量',
    };
    
    const displayField = fieldNames[field] || field;
    let formattedResult = result;
    
    // 格式化数字结果
    if (typeof result === 'number') {
      if (displayField.includes('金额')) {
        formattedResult = `¥${result.toFixed(2)}`;
      } else if (displayField.includes('时长')) {
        formattedResult = `${result.toFixed(2)} 小时`;
      } else if (Number.isInteger(result)) {
        formattedResult = result;
      } else {
        formattedResult = result.toFixed(2);
      }
    }

    // 生成聚合结果描述
    switch (func) {
      case 'sum':
        resultParts.push(`总${displayField}为 ${formattedResult}`);
        break;
      case 'avg':
        resultParts.push(`平均${displayField}为 ${formattedResult}`);
        break;
      case 'count':
        resultParts.push(`共有 ${result} 条记录`);
        break;
      case 'min':
        resultParts.push(`最小${displayField}为 ${formattedResult}`);
        break;
      case 'max':
        resultParts.push(`最大${displayField}为 ${formattedResult}`);
        break;
    }
  }

  if (resultParts.length > 0) {
    response += resultParts.join('，') + '。';
  }

  return response;
}

