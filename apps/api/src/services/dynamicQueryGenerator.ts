/**
 * 动态查询生成器 - 根据用户自然语言生成 Firestore 查询代码
 * 支持：查询、创建、统计聚合
 * 使用 Gemini AI 生成 JSON 格式的查询定义
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '@professional-workspace/shared';
import * as admin from 'firebase-admin';
import { checkAndWarnMissingIndex } from './indexDetector';

const logger = createLogger('dynamic-query-generator');

// 初始化 Gemini API
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

export interface QueryOperation {
  type: 'query' | 'create' | 'aggregate';
  collection: string;
  data?: Record<string, any>;
  filters?: Array<{
    field: string;
    operator: '<' | '<=' | '==' | '>=' | '>' | '!=' | 'in' | 'array-contains';
    value: any;
  }>;
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
  aggregations?: Array<{
    type: 'count' | 'sum' | 'avg' | 'min' | 'max';
    field: string;
  }>;
  groupBy?: string[];
}

export interface DynamicQueryResult {
  success: boolean;
  operations?: QueryOperation[];
  results?: any[];
  aggregationResults?: Record<string, any>;
  error?: string;
  explanation?: string;
}

/**
 * 获取查询生成的系统 Prompt
 */
function getQueryGeneratorPrompt(): string {
  return `你是一个 Firestore 查询生成专家。根据用户的自然语言问题，生成对应的 Firestore 查询操作。

支持的集合（Collection）:
- sessions: 课程记录 (clientName, date, startTime, endTime, sessionTypeName, totalAmount)
- clients: 客户 (name, clientTypeId, contactInfo, notes, createdAt)
- rates: 费率 (clientId, clientTypeId, category, amount, currency, effectiveDate)
- sessionTypes: 课程类型 (name, description)
- clientTypes: 客户类型 (name, description)
- knowledgeBase: 知识库 (userId, title, type, content, tags, category, isEncrypted)
- expenses: 支出 (userId, category, amount, date, description)

操作符: <, <=, ==, >=, >, !=, in, array-contains

请根据用户问题，生成以下 JSON 格式的查询操作数组:

{
  "operations": [
    {
      "type": "query|create|aggregate",
      "collection": "collection_name",
      "filters": [
        {
          "field": "fieldName",
          "operator": "==",
          "value": "value"
        }
      ],
      "orderBy": [
        {
          "field": "date",
          "direction": "desc"
        }
      ],
      "limit": 10,
      "aggregations": [
        {
          "type": "count|sum|avg|min|max",
          "field": "fieldName"
        }
      ],
      "groupBy": ["clientName"]
    }
  ],
  "explanation": "查询说明"
}

对于创建操作，包含 "data" 字段:
{
  "type": "create",
  "collection": "sessions",
  "data": {
    "clientName": "alex",
    "date": "2025-10-22",
    "startTime": "10:00",
    "endTime": "12:00"
  }
}

返回 ONLY 有效的 JSON，无其他文本。`;
}

/**
 * 使用 Gemini 生成动态查询操作
 */
export async function generateDynamicQuery(userPrompt: string, userId: string): Promise<DynamicQueryResult> {
  try {
    logger.info('Generating dynamic query', { userPrompt, userId });

    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = getQueryGeneratorPrompt();
    const fullPrompt = `${systemPrompt}\n\n用户问题: ${userPrompt}\n\nUser ID: ${userId}\n\n返回 JSON:`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    logger.debug('Gemini query response', { responseLength: response.length });

    // 解析 JSON
    let jsonText = response.trim();
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

    const parsed = JSON.parse(jsonText);
    const operations: QueryOperation[] = parsed.operations || [];

    logger.info('Generated query operations', { count: operations.length });

    return {
      success: true,
      operations,
      explanation: parsed.explanation,
    };
  } catch (error) {
    logger.error('Failed to generate dynamic query', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 执行生成的查询操作
 */
export async function executeDynamicQueries(
  operations: QueryOperation[],
  db: admin.firestore.Firestore,
  userId: string
): Promise<DynamicQueryResult> {
  try {
    logger.info('Executing dynamic queries', { operationCount: operations.length, userId });

    const results: any[] = [];
    let aggregationResults: Record<string, any> = {};

    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      logger.debug('Executing operation', { index: i, type: op.type, collection: op.collection });

      // 验证集合名
      validateCollection(op.collection);

      switch (op.type) {
        case 'query':
          // 检查是否需要索引
          await checkAndWarnMissingIndex(op);
          
          const queryResult = await executeQuery(db, op, userId);
          results.push({
            operationIndex: i,
            type: 'query',
            collection: op.collection,
            resultCount: queryResult.length,
            data: queryResult,
          });
          break;

        case 'create':
          const createResult = await executeCreate(db, op, userId);
          results.push({
            operationIndex: i,
            type: 'create',
            collection: op.collection,
            created: createResult,
          });
          break;

        case 'aggregate':
          const aggResult = await executeAggregate(db, op, userId);
          aggregationResults = { ...aggregationResults, ...aggResult };
          results.push({
            operationIndex: i,
            type: 'aggregate',
            collection: op.collection,
            aggregations: aggResult,
          });
          break;
      }
    }

    logger.info('Dynamic queries executed successfully', { resultCount: results.length });

    return {
      success: true,
      results,
      aggregationResults,
    };
  } catch (error) {
    logger.error('Failed to execute dynamic queries', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 验证集合名是否安全
 */
function validateCollection(collection: string): void {
  const allowedCollections = [
    'sessions',
    'clients',
    'rates',
    'sessionTypes',
    'clientTypes',
    'knowledgeBase',
    'expenses',
  ];

  if (!allowedCollections.includes(collection)) {
    throw new Error(`Collection "${collection}" is not allowed`);
  }
}

/**
 * 执行查询操作
 */
async function executeQuery(
  db: admin.firestore.Firestore,
  op: QueryOperation,
  userId: string
): Promise<any[]> {
  let query: admin.firestore.Query = db.collection(op.collection);

  // 添加用户筛选（某些集合需要）
  if (['knowledgeBase', 'expenses'].includes(op.collection)) {
    query = query.where('userId', '==', userId);
  }

  // 应用筛选条件
  if (op.filters && op.filters.length > 0) {
    for (const filter of op.filters) {
      query = query.where(filter.field, filter.operator, filter.value);
    }
  }

  // 应用排序
  if (op.orderBy && op.orderBy.length > 0) {
    for (const order of op.orderBy) {
      query = query.orderBy(order.field, order.direction);
    }
  }

  // 应用限制
  if (op.limit) {
    query = query.limit(op.limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * 执行创建操作
 */
async function executeCreate(
  db: admin.firestore.Firestore,
  op: QueryOperation,
  userId: string
): Promise<any> {
  if (!op.data) {
    throw new Error('Create operation requires "data" field');
  }

  const dataToCreate = { ...op.data };

  // 自动添加元数据
  dataToCreate.userId = userId;
  dataToCreate.createdAt = admin.firestore.FieldValue.serverTimestamp();
  dataToCreate.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  const docRef = await db.collection(op.collection).add(dataToCreate);

  logger.info('Document created', { collection: op.collection, docId: docRef.id, userId });

  return {
    id: docRef.id,
    ...dataToCreate,
  };
}

/**
 * 执行聚合操作
 */
async function executeAggregate(
  db: admin.firestore.Firestore,
  op: QueryOperation,
  userId: string
): Promise<Record<string, any>> {
  let query: admin.firestore.Query = db.collection(op.collection);

  // 添加用户筛选
  if (['knowledgeBase', 'expenses'].includes(op.collection)) {
    query = query.where('userId', '==', userId);
  }

  // 应用筛选条件
  if (op.filters && op.filters.length > 0) {
    for (const filter of op.filters) {
      query = query.where(filter.field, filter.operator, filter.value);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs.map(doc => doc.data());

  const results: Record<string, any> = {};

  if (!op.aggregations || op.aggregations.length === 0) {
    return results;
  }

  // 处理分组
  let groupedData: Record<string, any[]> = {};
  if (op.groupBy && op.groupBy.length > 0) {
    groupedData = groupByFields(docs, op.groupBy);
  } else {
    groupedData['_total'] = docs;
  }

  // 计算聚合
  for (const agg of op.aggregations) {
    for (const [groupKey, groupDocs] of Object.entries(groupedData)) {
      const aggKey = `${agg.type}(${agg.field})_${groupKey}`;

      switch (agg.type) {
        case 'count':
          results[aggKey] = groupDocs.length;
          break;
        case 'sum':
          results[aggKey] = groupDocs.reduce((sum, doc) => sum + (doc[agg.field] || 0), 0);
          break;
        case 'avg':
          const sum = groupDocs.reduce((s, doc) => s + (doc[agg.field] || 0), 0);
          results[aggKey] = groupDocs.length > 0 ? sum / groupDocs.length : 0;
          break;
        case 'min':
          results[aggKey] = Math.min(...groupDocs.map(doc => doc[agg.field] || Infinity));
          break;
        case 'max':
          results[aggKey] = Math.max(...groupDocs.map(doc => doc[agg.field] || -Infinity));
          break;
      }
    }
  }

  logger.info('Aggregation completed', { collection: op.collection, aggregationCount: op.aggregations.length });

  return results;
}

/**
 * 按字段分组
 */
function groupByFields(docs: any[], fields: string[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  for (const doc of docs) {
    const key = fields.map(f => doc[f]).join('_');
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(doc);
  }

  return grouped;
}
