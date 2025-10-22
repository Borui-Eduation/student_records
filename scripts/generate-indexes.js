#!/usr/bin/env node

/**
 * 自动生成 Firestore 索引配置
 * 根据常见查询模式生成所需的复合索引
 */

const fs = require('fs');
const path = require('path');

// 定义每个集合的常用查询模式
const queryPatterns = {
  sessions: {
    userFields: ['userId'],
    filterFields: ['clientName', 'sessionTypeName', 'billingStatus'],
    rangeFields: ['date', 'totalAmount', 'durationHours'],
    orderFields: ['date', 'createdAt', 'totalAmount'],
  },
  clients: {
    userFields: ['userId'],
    filterFields: ['name', 'clientTypeId', 'active'],
    rangeFields: [],
    orderFields: ['name', 'createdAt'],
  },
  rates: {
    userFields: ['userId'],
    filterFields: ['clientId', 'clientTypeId', 'category'],
    rangeFields: ['amount', 'effectiveDate'],
    orderFields: ['effectiveDate', 'amount'],
  },
  knowledgeBase: {
    userFields: ['userId'],
    filterFields: ['type', 'category'],
    arrayFields: ['tags'],
    rangeFields: [],
    orderFields: ['updatedAt', 'createdAt'],
  },
  expenses: {
    userFields: ['userId'],
    filterFields: ['category', 'paymentMethod', 'clientId'],
    rangeFields: ['date', 'amount'],
    orderFields: ['date', 'createdAt', 'amount'],
  },
  invoices: {
    userFields: ['userId'],
    filterFields: ['clientId', 'status'],
    rangeFields: ['issueDate'],
    orderFields: ['issueDate'],
  },
  sessionTypes: {
    userFields: ['userId'],
    filterFields: [],
    rangeFields: [],
    orderFields: ['name', 'createdAt'],
  },
  clientTypes: {
    userFields: ['userId'],
    filterFields: [],
    rangeFields: [],
    orderFields: ['name', 'createdAt'],
  },
};

/**
 * 生成单个集合的索引
 */
function generateCollectionIndexes(collection, pattern) {
  const indexes = [];
  const { userFields = [], filterFields = [], rangeFields = [], orderFields = [], arrayFields = [] } = pattern;

  // 1. userId + orderBy 索引（基础查询）
  for (const orderField of orderFields) {
    indexes.push({
      collectionGroup: collection,
      queryScope: 'COLLECTION',
      fields: [
        ...userFields.map(f => ({ fieldPath: f, order: 'ASCENDING' })),
        { fieldPath: orderField, order: 'DESCENDING' },
      ],
    });

    // 也生成 ASC 版本
    indexes.push({
      collectionGroup: collection,
      queryScope: 'COLLECTION',
      fields: [
        ...userFields.map(f => ({ fieldPath: f, order: 'ASCENDING' })),
        { fieldPath: orderField, order: 'ASCENDING' },
      ],
    });
  }

  // 2. userId + filter + orderBy 索引（带筛选的查询）
  for (const filterField of filterFields) {
    for (const orderField of orderFields) {
      indexes.push({
        collectionGroup: collection,
        queryScope: 'COLLECTION',
        fields: [
          ...userFields.map(f => ({ fieldPath: f, order: 'ASCENDING' })),
          { fieldPath: filterField, order: 'ASCENDING' },
          { fieldPath: orderField, order: 'DESCENDING' },
        ],
      });
    }
  }

  // 3. userId + rangeFilter + orderBy 索引（范围查询）
  for (const rangeField of rangeFields) {
    for (const orderField of orderFields) {
      if (rangeField !== orderField) {
        indexes.push({
          collectionGroup: collection,
          queryScope: 'COLLECTION',
          fields: [
            ...userFields.map(f => ({ fieldPath: f, order: 'ASCENDING' })),
            { fieldPath: rangeField, order: 'ASCENDING' },
            { fieldPath: orderField, order: 'DESCENDING' },
          ],
        });
      }
    }
  }

  // 4. userId + arrayContains + orderBy 索引（数组查询）
  for (const arrayField of arrayFields) {
    for (const orderField of orderFields) {
      indexes.push({
        collectionGroup: collection,
        queryScope: 'COLLECTION',
        fields: [
          ...userFields.map(f => ({ fieldPath: f, order: 'ASCENDING' })),
          { fieldPath: arrayField, arrayConfig: 'CONTAINS' },
          { fieldPath: orderField, order: 'DESCENDING' },
        ],
      });
    }
  }

  return indexes;
}

/**
 * 生成所有索引
 */
function generateAllIndexes() {
  const allIndexes = [];

  for (const [collection, pattern] of Object.entries(queryPatterns)) {
    const collectionIndexes = generateCollectionIndexes(collection, pattern);
    allIndexes.push(...collectionIndexes);
  }

  // 去重（基于字段组合）
  const uniqueIndexes = [];
  const seen = new Set();

  for (const index of allIndexes) {
    const key = `${index.collectionGroup}:${JSON.stringify(index.fields)}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueIndexes.push(index);
    }
  }

  return {
    indexes: uniqueIndexes,
    fieldOverrides: [],
  };
}

/**
 * 主函数
 */
function main() {
  console.log('🔥 生成 Firestore 索引配置...\n');

  const indexConfig = generateAllIndexes();
  const outputPath = path.join(__dirname, '..', 'firestore.indexes.json');

  // 备份旧文件
  if (fs.existsSync(outputPath)) {
    const backupPath = path.join(__dirname, '..', 'firestore.indexes.backup.json');
    fs.copyFileSync(outputPath, backupPath);
    console.log(`✅ 备份旧索引文件到: ${backupPath}`);
  }

  // 写入新配置
  fs.writeFileSync(outputPath, JSON.stringify(indexConfig, null, 2), 'utf8');

  console.log(`✅ 生成 ${indexConfig.indexes.length} 个索引配置`);
  console.log(`✅ 已写入: ${outputPath}\n`);

  // 统计每个集合的索引数
  const collectionStats = {};
  for (const index of indexConfig.indexes) {
    const collection = index.collectionGroup;
    collectionStats[collection] = (collectionStats[collection] || 0) + 1;
  }

  console.log('📊 每个集合的索引数量:');
  for (const [collection, count] of Object.entries(collectionStats)) {
    console.log(`   ${collection}: ${count} 个索引`);
  }

  console.log('\n🚀 下一步操作:');
  console.log('   1. 审查生成的 firestore.indexes.json');
  console.log('   2. 运行: firebase deploy --only firestore:indexes');
  console.log('   3. 等待索引构建完成（可能需要几分钟）\n');
}

// 运行
main();

