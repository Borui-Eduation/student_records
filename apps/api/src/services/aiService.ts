/**
 * AI Service - Natural Language Processing using Google Gemini
 * Parses user input and converts it to structured MCP commands
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '@professional-workspace/shared';
import type { MCPParseResult, MCPWorkflow, MCPContext } from '@professional-workspace/shared';
import { getCache } from './cache';
import { generateAISystemContext } from './aiSystemContext';
import * as crypto from 'crypto';

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
 * Generate cache key from input and context
 */
function generateCacheKey(input: string, context?: MCPContext): string {
  const contextStr = context ? JSON.stringify({
    currentDate: context.currentDate,
    timezone: context.userPreferences?.timezone,
  }) : '';
  
  const combined = `${input}:${contextStr}`;
  return `ai-parse:${crypto.createHash('md5').update(combined).digest('hex')}`;
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

    // 检查缓存
    const cacheKey = generateCacheKey(input, context);
    const cache = getCache();
    const cachedResult = await cache.get<MCPParseResult>(cacheKey);
    
    if (cachedResult && cachedResult.success) {
      logger.info('Cache HIT for AI parsing', { inputLength: input.length });
      return cachedResult;
    }

    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 使用简化的系统提示 - 关键内容仅保留
    const systemPrompt = getOptimizedSystemPrompt();
    const contextInfo = context ? `Current Date: ${context.currentDate}\nTimezone: ${context.userPreferences?.timezone || 'Asia/Shanghai'}\nCurrency: ${context.userPreferences?.defaultCurrency || 'CNY'}` : '';
    
    const fullPrompt = `${systemPrompt}\n\n${contextInfo}\n\nUser Input:\n${input}\n\nReturn ONLY valid JSON:`;

    // Call Gemini API
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    logger.debug('Gemini API response received', { responseLength: text.length });

    // Parse the JSON response
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

    const parseResult: MCPParseResult = {
      success: true,
      workflow,
    };

    // 缓存结果 (15分钟内存TTL + 7天Firestore TTL) - 优化后
    await cache.set(cacheKey, parseResult, { memoryTtl: 15, firestoreTtl: 7 });

    return parseResult;
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
 * Optimized system prompt with comprehensive context
 */
function getOptimizedSystemPrompt(): string {
  // 获取 AI 系统上下文
  const systemContext = generateAISystemContext();
  
  return `You are an AI assistant for a professional workspace system. Parse natural language into MCP commands.

${systemContext}

RESPONSE FORMAT (JSON only):
{
  "commands": [
    {
      "operation": "create|read|update|delete|search|aggregate",
      "entity": "client|session|rate|sessionType|clientType|knowledgeBase",
      "data": {
        // For session: MUST include clientName, sessionTypeName, date, startTime, endTime
        // For client: MUST include name
        // For rate: MUST include amount
        // NEVER include undefined values
      },
      "conditions": {},
      "aggregations": [{"function": "sum|count|avg|min|max", "field": "fieldName"}],
      "metadata": {"confidence": 0.95, "warnings": []}
    }
  ],
  "description": "What will happen",
  "requiresConfirmation": false
}

CRITICAL RULES:
1. ⚠️ For session creation, ALWAYS extract and provide ALL required fields:
   - clientName (from user input like "sophie", "Alex", etc.)
   - sessionTypeName (from user input like "Math", "IB Math HL", etc.)
   - date (parse from "today", "明天", specific dates, etc.)
   - startTime (parse from "10点", "上午10点", "10:00", etc.)
   - endTime (parse from time ranges like "10-12点")
   
2. ⚠️ NEVER add fields with undefined values
   - If clientId is unknown, don't add it
   - If clientTypeId is unknown, don't add it
   
3. Search for dependencies before creating
4. requiresConfirmation=true ONLY for delete/update
5. Return ONLY JSON, no extra text

EXAMPLE - Session Creation:
Input: "create a session for sophie, last sunday morning, 8:30-9:30, rate at 65, IB Math AA HL"
Output:
{
  "commands": [
    {
      "operation": "create",
      "entity": "session",
      "data": {
        "clientName": "sophie",
        "sessionTypeName": "IB Math AA HL",
        "date": "2025-10-19",
        "startTime": "08:30",
        "endTime": "09:30",
        "rateAmount": 65
      }
    }
  ],
  "description": "Create session for sophie...",
  "requiresConfirmation": false
}`;
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
  // Log the received data for debugging
  console.log('generateAggregateResponse received:', JSON.stringify(aggregationData));
  
  if (!aggregationData || !aggregationData.aggregations) {
    console.error('Invalid aggregationData:', aggregationData);
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

/**
 * Generate a natural title for query result
 * Uses AI-like logic to create readable titles
 */
export function generateQueryResultTitle(
  userInput: string,
  operation: string,
  _entity: string
): string {
  // Extract key information from user input
  const cleaned = userInput.trim();
  
  // For aggregate queries
  if (operation === 'aggregate') {
    // Examples: "计算alex的total" -> "计算alex的total - 查询结果"
    return `${cleaned} - 查询结果`;
  }
  
  // For search queries
  if (operation === 'search') {
    return `${cleaned} - 搜索记录`;
  }
  
  return `${cleaned} - AI查询`;
}

/**
 * Generate natural tags for query result
 */
export function generateQueryResultTags(
  operation: string,
  entity: string,
  conditions?: Record<string, any>
): string[] {
  const tags: string[] = ['ai-generated', 'query-result'];
  
  // Add operation type
  if (operation === 'aggregate') {
    tags.push('统计查询');
  } else if (operation === 'search') {
    tags.push('搜索查询');
  }
  
  // Add entity type in Chinese
  const entityNameMap: Record<string, string> = {
    session: '课程',
    client: '客户',
    invoice: '发票',
    expense: '支出',
    rate: '费率',
    sessionType: '课程类型',
    clientType: '客户类型',
    expenseCategory: '支出分类',
    knowledgeBase: '知识库',
  };
  
  if (entityNameMap[entity]) {
    tags.push(entityNameMap[entity]);
  }
  
  // Add client name if present
  if (conditions?.clientName) {
    tags.push(conditions.clientName);
  }
  
  return tags;
}

