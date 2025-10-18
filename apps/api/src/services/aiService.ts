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

**Operation Types:**
- create: Create new record
- read/search: Query existing records
- update: Modify existing record
- delete: Remove record

**Time Parsing Rules:**
- "今天" / "today" → current date
- "明天" / "tomorrow" → current date + 1 day
- "下周一" → next Monday
- "10-12点" / "10:00-12:00" → startTime: "10:00", endTime: "12:00"
- "上午10点" → "10:00"
- "下午2点" → "14:00"

**Parsing Instructions:**
1. Parse the user's natural language input
2. Identify the operation (create, read, update, delete)
3. Identify the entities involved (client, session, rate, etc.)
4. Extract all relevant data fields
5. Return a JSON object with the following structure:

{
  "commands": [
    {
      "operation": "create|read|update|delete|search",
      "entity": "client|session|rate|sessionType|clientType",
      "data": { /* extracted data */ },
      "conditions": { /* search/update conditions */ },
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
6. Set "requiresConfirmation" to true for destructive operations (update, delete)

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
        "date": "2025-10-18",
        "startTime": "10:00",
        "endTime": "12:00",
        "rateAmount": 80
      }
    }
  ],
  "description": "将为客户Hubery创建今天10:00-12:00的cello课程记录，费率为80元/小时。如果客户、课程类型或费率不存在，将自动创建。",
  "requiresConfirmation": true
}

**Example 2:**
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

**Example 3:**
Input: "更新Hubery的rate为90"
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
      "operation": "update",
      "entity": "rate",
      "data": { "amount": 90 },
      "conditions": { "clientName": "Hubery" }
    }
  ],
  "description": "将Hubery的费率更新为90元/小时",
  "requiresConfirmation": true
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
    const validOperations = ['create', 'read', 'update', 'delete', 'search'];
    if (!validOperations.includes(cmd.operation)) {
      errors.push(`命令 ${index + 1}: 无效的操作类型 "${cmd.operation}"`);
    }

    // Validate entity
    const validEntities = ['client', 'session', 'rate', 'invoice', 'sessionType', 'clientType', 'expense', 'expenseCategory'];
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

