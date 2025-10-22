/**
 * Firestore 索引检测器
 * 检测查询是否需要索引，并生成索引配置建议
 */

import { createLogger } from '@professional-workspace/shared';
import type { QueryOperation } from './dynamicQueryGenerator';

const logger = createLogger('index-detector');

interface IndexRequirement {
  collection: string;
  fields: Array<{
    fieldPath: string;
    order?: 'ASCENDING' | 'DESCENDING';
    arrayConfig?: 'CONTAINS';
  }>;
  reason: string;
}

/**
 * 检测查询是否需要复合索引
 */
export function detectIndexRequirement(operation: QueryOperation): IndexRequirement | null {
  if (operation.type !== 'query' && operation.type !== 'aggregate') {
    return null; // 创建操作不需要索引
  }

  const { collection, filters = [], orderBy = [] } = operation;

  // 单字段查询通常不需要复合索引
  if (filters.length === 0 && orderBy.length <= 1) {
    return null;
  }

  // 需要复合索引的情况
  const needsCompositeIndex = 
    (filters.length > 1) ||                                    // 多个筛选
    (filters.length > 0 && orderBy.length > 0) ||            // 筛选 + 排序
    (orderBy.length > 1);                                     // 多个排序

  if (!needsCompositeIndex) {
    return null;
  }

  // 生成索引字段配置
  const indexFields: IndexRequirement['fields'] = [];

  // 1. 用户隔离字段（某些集合需要）
  if (['knowledgeBase', 'expenses'].includes(collection)) {
    indexFields.push({
      fieldPath: 'userId',
      order: 'ASCENDING',
    });
  }

  // 2. 等值筛选字段
  for (const filter of filters) {
    if (filter.operator === '==') {
      indexFields.push({
        fieldPath: filter.field,
        order: 'ASCENDING',
      });
    } else if (filter.operator === 'array-contains') {
      indexFields.push({
        fieldPath: filter.field,
        arrayConfig: 'CONTAINS',
      });
    }
  }

  // 3. 范围筛选字段（<, <=, >, >=）
  const rangeFilter = filters.find(f => ['<', '<=', '>', '>='].includes(f.operator));
  if (rangeFilter) {
    indexFields.push({
      fieldPath: rangeFilter.field,
      order: 'ASCENDING',
    });
  }

  // 4. 排序字段
  for (const order of orderBy) {
    // 如果已经在范围筛选中，跳过
    if (rangeFilter && order.field === rangeFilter.field) {
      continue;
    }
    
    indexFields.push({
      fieldPath: order.field,
      order: order.direction === 'asc' ? 'ASCENDING' : 'DESCENDING',
    });
  }

  // 生成原因说明
  let reason = `查询 ${collection} 集合`;
  if (filters.length > 0) {
    reason += `，筛选字段: ${filters.map(f => f.field).join(', ')}`;
  }
  if (orderBy.length > 0) {
    reason += `，排序字段: ${orderBy.map(o => o.field).join(', ')}`;
  }

  return {
    collection,
    fields: indexFields,
    reason,
  };
}

/**
 * 生成 Firestore 索引配置 JSON
 */
export function generateIndexConfig(requirement: IndexRequirement): any {
  return {
    collectionGroup: requirement.collection,
    queryScope: 'COLLECTION',
    fields: requirement.fields,
  };
}

/**
 * 检查索引是否缺失并记录警告
 */
export async function checkAndWarnMissingIndex(operation: QueryOperation): Promise<void> {
  const requirement = detectIndexRequirement(operation);

  if (!requirement) {
    return; // 不需要复合索引
  }

  logger.warn('可能需要 Firestore 复合索引', {
    collection: requirement.collection,
    fields: requirement.fields.map(f => f.fieldPath),
    reason: requirement.reason,
  });

  // 生成索引配置建议
  const indexConfig = generateIndexConfig(requirement);
  logger.info('建议的索引配置:', {
    config: JSON.stringify(indexConfig, null, 2),
  });

  // 生成 Firebase CLI 命令
  const cliCommand = generateFirebaseCLICommand(requirement);
  logger.info('或使用 Firebase CLI 创建索引:', { command: cliCommand });
}

/**
 * 生成 Firebase CLI 命令
 */
function generateFirebaseCLICommand(requirement: IndexRequirement): string {
  const fieldsStr = requirement.fields
    .map(f => {
      if (f.arrayConfig) {
        return `${f.fieldPath}:ARRAY_CONTAINS`;
      }
      return `${f.fieldPath}:${f.order}`;
    })
    .join(',');

  return `firebase firestore:indexes:create ${requirement.collection} ${fieldsStr}`;
}

/**
 * 批量检测多个操作的索引需求
 */
export function detectBatchIndexRequirements(operations: QueryOperation[]): IndexRequirement[] {
  const requirements: IndexRequirement[] = [];

  for (const op of operations) {
    const req = detectIndexRequirement(op);
    if (req) {
      requirements.push(req);
    }
  }

  return requirements;
}

/**
 * 将索引需求合并到 firestore.indexes.json
 */
export function mergeIndexRequirements(
  existingIndexes: any[],
  newRequirements: IndexRequirement[]
): any[] {
  const merged = [...existingIndexes];
  const existingKeys = new Set(
    existingIndexes.map(idx => 
      `${idx.collectionGroup}:${JSON.stringify(idx.fields)}`
    )
  );

  for (const req of newRequirements) {
    const config = generateIndexConfig(req);
    const key = `${config.collectionGroup}:${JSON.stringify(config.fields)}`;

    if (!existingKeys.has(key)) {
      merged.push(config);
      existingKeys.add(key);
    }
  }

  return merged;
}

