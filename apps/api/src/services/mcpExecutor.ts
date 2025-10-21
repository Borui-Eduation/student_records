/**
 * MCP Executor - Executes MCP commands against Firestore
 * Handles all database operations for AI-parsed commands
 */

import * as admin from 'firebase-admin';
import { createLogger } from '@professional-workspace/shared';
import type { 
  MCPCommand, 
  MCPWorkflow, 
  MCPExecutionResult, 
  MCPEntity
} from '@professional-workspace/shared';
import { cleanUndefinedValues } from './firestoreHelpers';

const logger = createLogger('mcp-executor');

export interface ExecutionContext {
  db: admin.firestore.Firestore;
  userId: string;
  userRole: 'admin' | 'superadmin';
}

/**
 * Execute a complete workflow
 */
export async function executeWorkflow(
  workflow: MCPWorkflow,
  context: ExecutionContext
): Promise<MCPExecutionResult> {
  const startTime = Date.now();
  const affectedRecords: MCPExecutionResult['affectedRecords'] = [];

  try {
    logger.info('Executing workflow', {
      commandCount: workflow.commands.length,
      description: workflow.description,
    });

    // Execute commands sequentially
    const results: any[] = [];
    const searchResults = new Map<string, any>(); // Cache search results

    for (let i = 0; i < workflow.commands.length; i++) {
      const command = workflow.commands[i];
      
      logger.info(`Executing command ${i + 1}/${workflow.commands.length}`, {
        operation: command.operation,
        entity: command.entity,
      });

      const result = await executeCommand(command, context, searchResults);
      results.push(result);

      // Log result for debugging
      if (!result.success) {
        logger.error(`Command ${i + 1} failed`, {
          operation: command.operation,
          entity: command.entity,
          error: result.error,
        });
        // Stop execution on critical create failures
        if (command.operation === 'create') {
          return {
            success: false,
            error: result.error || 'Command execution failed',
            affectedRecords,
          };
        }
      } else {
        logger.info(`Command ${i + 1} succeeded`, {
          operation: command.operation,
          entity: command.entity,
          hasData: !!result.data,
        });
      }

      // Track affected records
      if (result.affectedRecords) {
        affectedRecords.push(...result.affectedRecords);
      }

      // Cache search results for later use
      if (command.operation === 'search' && result.success) {
        const key = `${command.entity}:${JSON.stringify(command.conditions || {})}`;
        searchResults.set(key, result.data);
      }
    }

    const executionTime = Date.now() - startTime;
    logger.info('Workflow executed successfully', {
      executionTimeMs: executionTime,
      affectedRecords: affectedRecords.length,
    });

    return {
      success: true,
      data: results.map(r => r.data),
      affectedRecords,
    };
  } catch (error) {
    logger.error('Workflow execution failed', error instanceof Error ? error : new Error(String(error)));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      affectedRecords,
    };
  }
}

/**
 * Execute a single MCP command
 */
async function executeCommand(
  command: MCPCommand,
  context: ExecutionContext,
  searchCache: Map<string, any>
): Promise<MCPExecutionResult> {
  switch (command.operation) {
    case 'search':
      return searchEntity(command, context);
    case 'create':
      return createEntity(command, context, searchCache);
    case 'update':
      return updateEntity(command, context);
    case 'delete':
      return deleteEntity(command, context);
    case 'read':
      return searchEntity(command, context);
    case 'aggregate':
      return aggregateEntity(command, context);
    default:
      return {
        success: false,
        error: `Unsupported operation: ${command.operation}`,
      };
  }
}

/**
 * Search for entities
 */
async function searchEntity(
  command: MCPCommand,
  context: ExecutionContext
): Promise<MCPExecutionResult> {
  const { entity, conditions } = command;
  const { db, userId, userRole } = context;

  try {
    let query: admin.firestore.Query = db.collection(getCollectionName(entity));

    // Add userId filter (unless superadmin)
    if (userRole !== 'superadmin') {
      query = query.where('userId', '==', userId);
    }

    // Apply conditions
    if (conditions) {
      // Handle special case: searching by name
      if (conditions.name) {
        query = query.where('name', '==', conditions.name);
      }

      // Handle special case: searching by clientName (for sessions)
      if (conditions.clientName) {
        // First search for client with exact match
        let clientQuery = await db
          .collection('clients')
          .where('userId', '==', userId)
          .where('name', '==', conditions.clientName)
          .limit(1)
          .get();

        let foundClientDocs = clientQuery.docs;

        // If no exact match, try case-insensitive search
        if (foundClientDocs.length === 0) {
          const allClients = await db
            .collection('clients')
            .where('userId', '==', userId)
            .get();
          
          foundClientDocs = allClients.docs.filter(doc => 
            doc.data().name.toLowerCase() === conditions.clientName.toLowerCase()
          );
        }

        if (foundClientDocs.length > 0) {
          const clientId = foundClientDocs[0].id;
          query = query.where('clientId', '==', clientId);
        } else {
          // 客户不存在，返回空结果
          return {
            success: true,
            data: [],
          };
        }
      }

      // Handle date range
      if (conditions.dateRange) {
        const { start, end } = conditions.dateRange;
        query = query
          .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(start)))
          .where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(end)));
      }

      // Handle amount
      if (conditions.amount !== undefined) {
        query = query.where('amount', '==', conditions.amount);
      }

      // Handle sessionTypeName (for sessions)
      if (conditions.sessionTypeName) {
        const typeQuery = await db
          .collection('sessionTypes')
          .where('userId', '==', userId)
          .where('name', '==', conditions.sessionTypeName)
          .limit(1)
          .get();

        if (!typeQuery.empty) {
          const typeId = typeQuery.docs[0].id;
          query = query.where('sessionTypeId', '==', typeId);
        }
      }

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
    }

    const snapshot = await query.get();
    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      const item: any = {
        id: doc.id,
        ...data,
      };
      
      // Handle Firestore Timestamps for serialization
      if (data.date && typeof data.date.toDate === 'function') {
        item.date = data.date.toDate().toISOString();
      }
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        item.createdAt = data.createdAt.toDate().toISOString();
      }
      if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
        item.updatedAt = data.updatedAt.toDate().toISOString();
      }
      if (data.effectiveDate && typeof data.effectiveDate.toDate === 'function') {
        item.effectiveDate = data.effectiveDate.toDate().toISOString();
      }

      // For knowledgeBase: hide encrypted content in search results
      if (entity === 'knowledgeBase' && data.isEncrypted) {
        item.content = '[ENCRYPTED]';
      }

      return item;
    });

    return {
      success: true,
      data: items,
    };
  } catch (error) {
    logger.error('Search failed', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

/**
 * Create a new entity
 */
async function createEntity(
  command: MCPCommand,
  context: ExecutionContext,
  searchCache: Map<string, any>
): Promise<MCPExecutionResult> {
  const { entity, data } = command;
  const { db, userId } = context;

  try {
    const now = admin.firestore.Timestamp.now();
    let entityData: any = {
      ...data,
      userId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };

    // Handle entity-specific logic
    switch (entity) {
      case 'client':
        entityData = {
          name: data?.name || data?.clientName || '',
          clientTypeId: data?.clientTypeId,
          contactInfo: data?.contactInfo || {},
          notes: data?.notes || '',
          active: true,
          defaultRateIds: [],
          userId,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
        };
        break;

      case 'session':
        // Need to resolve client and sessionType
        const resolvedSession = await resolveSessionData(data || {}, context, searchCache);
        if (!resolvedSession.success) {
          return resolvedSession;
        }
        entityData = resolvedSession.data!;
        break;

      case 'rate':
        // Resolve client if clientName is provided
        let resolvedClientId = data?.clientId;
        if (data?.clientName) {
          const clientResult = await findOrCreateClient(data.clientName, context);
          if (!clientResult.success) {
            return clientResult;
          }
          resolvedClientId = clientResult.data!.id;
        }

        entityData = {
          clientId: resolvedClientId,
          clientTypeId: data?.clientTypeId,
          category: data?.category || 'General',
          amount: data?.amount || data?.rateAmount || 0,
          currency: data?.currency || 'CNY',
          effectiveDate: data?.effectiveDate 
            ? admin.firestore.Timestamp.fromDate(new Date(data.effectiveDate))
            : now,
          description: data?.description || '',
          userId,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
        };
        break;

      case 'sessionType':
        entityData = {
          name: data?.name || data?.sessionTypeName || '',
          description: data?.description || '',
          userId,
          createdAt: now,
          updatedAt: now,
        };
        break;

      case 'clientType':
        entityData = {
          name: data?.name || '',
          description: data?.description || '',
          userId,
          createdAt: now,
          updatedAt: now,
        };
        break;

      case 'knowledgeBase':
        // Determine if content should be encrypted
        const sensitiveTypes = ['api-key', 'ssh-record', 'password'];
        const shouldEncrypt = data?.requireEncryption || sensitiveTypes.includes(data?.type);
        
        // Note: Encryption will be handled by the knowledgeBase router
        // We just pass requireEncryption flag
        entityData = {
          userId,
          title: data?.title || '',
          type: data?.type || 'note',
          content: data?.content || '',
          requireEncryption: shouldEncrypt,
          tags: data?.tags || [],
          category: data?.category,
          attachments: [],
          accessCount: 0,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          createdByAI: true,
          aiGeneratedAt: now,
        };
        break;
    }

    const docRef = await db.collection(getCollectionName(entity)).add(cleanUndefinedValues(entityData));
    const created = { id: docRef.id, ...entityData };

    return {
      success: true,
      data: created,
      affectedRecords: [
        {
          entity,
          id: docRef.id,
          operation: 'create',
        },
      ],
    };
  } catch (error) {
    logger.error('Create failed', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Create failed',
    };
  }
}

/**
 * Update an existing entity
 */
async function updateEntity(
  command: MCPCommand,
  context: ExecutionContext
): Promise<MCPExecutionResult> {
  const { entity, data } = command;
  const { db, userId, userRole } = context;

  try {
    // First find the entity
    const searchResult = await searchEntity(
      { ...command, operation: 'search' },
      context
    );

    if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
      return {
        success: false,
        error: `No ${entity} found matching the conditions`,
      };
    }

    const targetDoc = searchResult.data[0];
    const docRef = db.collection(getCollectionName(entity)).doc(targetDoc.id);

    // Check ownership
    if (userRole !== 'superadmin' && targetDoc.userId !== userId) {
      return {
        success: false,
        error: 'You do not have permission to update this record',
      };
    }

    const updateData = {
      ...data,
      updatedAt: admin.firestore.Timestamp.now(),
    };

    await docRef.update(updateData);

    return {
      success: true,
      data: { id: targetDoc.id, ...targetDoc, ...updateData },
      affectedRecords: [
        {
          entity,
          id: targetDoc.id,
          operation: 'update',
        },
      ],
    };
  } catch (error) {
    logger.error('Update failed', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Update failed',
    };
  }
}

/**
 * Delete an entity
 */
async function deleteEntity(
  command: MCPCommand,
  context: ExecutionContext
): Promise<MCPExecutionResult> {
  const { entity } = command;
  const { db, userId, userRole } = context;

  try {
    // First find the entity
    const searchResult = await searchEntity(
      { ...command, operation: 'search' },
      context
    );

    if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
      return {
        success: false,
        error: `No ${entity} found matching the conditions`,
      };
    }

    const targetDoc = searchResult.data[0];
    const docRef = db.collection(getCollectionName(entity)).doc(targetDoc.id);

    // Check ownership
    if (userRole !== 'superadmin' && targetDoc.userId !== userId) {
      return {
        success: false,
        error: 'You do not have permission to delete this record',
      };
    }

    // For clients, do soft delete
    if (entity === 'client') {
      await docRef.update({
        active: false,
        updatedAt: admin.firestore.Timestamp.now(),
      });
    } else {
      await docRef.delete();
    }

    return {
      success: true,
      data: { id: targetDoc.id },
      affectedRecords: [
        {
          entity,
          id: targetDoc.id,
          operation: 'delete',
        },
      ],
    };
  } catch (error) {
    logger.error('Delete failed', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Helper: Resolve session data (client, sessionType, rate)
 */
async function resolveSessionData(
  data: any,
  context: ExecutionContext,
  _searchCache: Map<string, any>
): Promise<MCPExecutionResult> {
  const { db, userId } = context;

  try {
    // 1. Resolve client
    const clientResult = await findOrCreateClient(data.clientName, context);
    if (!clientResult.success) {
      return clientResult;
    }
    const client = clientResult.data!;

    // 2. Resolve sessionType
    const sessionTypeResult = await findOrCreateSessionType(data.sessionTypeName, context);
    if (!sessionTypeResult.success) {
      return sessionTypeResult;
    }
    const sessionType = sessionTypeResult.data!;

    // 3. Resolve or create rate
    let rate: any;
    if (data.rateAmount !== undefined) {
      const rateResult = await findOrCreateRate(
        client.id,
        data.rateAmount,
        data.currency || 'CNY',
        context
      );
      if (!rateResult.success) {
        return rateResult;
      }
      rate = rateResult.data!;
    } else {
      // Try to find existing rate for this client
      const rateQuery = await db
        .collection('rates')
        .where('userId', '==', userId)
        .where('clientId', '==', client.id)
        .orderBy('effectiveDate', 'desc')
        .limit(1)
        .get();

      if (rateQuery.empty) {
        return {
          success: false,
          error: `No rate found for client ${data.clientName}. Please specify a rate.`,
        };
      }

      rate = { id: rateQuery.docs[0].id, ...rateQuery.docs[0].data() };
    }

    // 4. Calculate duration and amount
    const startTime = data.startTime;
    const endTime = data.endTime;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (durationHours <= 0) {
      return {
        success: false,
        error: 'End time must be after start time',
      };
    }

    const totalAmount = durationHours * rate.amount;

    // 5. Build session data with AI marker
    const now = admin.firestore.Timestamp.now();
    const sessionData: any = {
      userId,
      clientId: client.id,
      clientName: client.name,
      date: admin.firestore.Timestamp.fromDate(new Date(data.date)),
      startTime,
      endTime,
      durationHours,
      sessionTypeId: sessionType.id,
      rateId: rate.id,
      rateAmount: rate.amount,
      totalAmount,
      currency: rate.currency,
      billingStatus: 'unbilled' as const,
      contentBlocks: [],
      notes: data.notes ? `${data.notes}\n\n🤖 由AI助手创建` : '🤖 由AI助手创建',
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      createdByAI: true, // AI创建标记
      aiGeneratedAt: now, // AI创建时间
    };

    // Only add clientTypeId if it exists (Firestore doesn't allow undefined)
    if (client.clientTypeId) {
      sessionData.clientTypeId = client.clientTypeId;
    }

    return {
      success: true,
      data: sessionData,
    };
  } catch (error) {
    logger.error('Failed to resolve session data', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resolve session data',
    };
  }
}

/**
 * Helper: Find or create client
 */
async function findOrCreateClient(
  clientName: string,
  context: ExecutionContext
): Promise<MCPExecutionResult> {
  const { db, userId } = context;

  // Search for existing client
  const clientQuery = await db
    .collection('clients')
    .where('userId', '==', userId)
    .where('name', '==', clientName)
    .limit(1)
    .get();

  if (!clientQuery.empty) {
    const client = { id: clientQuery.docs[0].id, ...clientQuery.docs[0].data() };
    return { success: true, data: client };
  }

  // Create new client with AI marker
  const now = admin.firestore.Timestamp.now();
  const clientData = {
    name: clientName,
    contactInfo: {},
    notes: '🤖 由AI助手自动创建',
    active: true,
    defaultRateIds: [],
    userId,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    createdByAI: true, // AI创建标记
    aiGeneratedAt: now, // AI创建时间
  };

  const docRef = await db.collection('clients').add(cleanUndefinedValues(clientData));
  const client = { id: docRef.id, ...clientData };

  logger.info('Auto-created client', { clientName, clientId: docRef.id });

  return { success: true, data: client };
}

/**
 * Helper: Find or create sessionType
 */
async function findOrCreateSessionType(
  sessionTypeName: string,
  context: ExecutionContext
): Promise<MCPExecutionResult> {
  const { db, userId } = context;

  // Search for existing sessionType
  const typeQuery = await db
    .collection('sessionTypes')
    .where('userId', '==', userId)
    .where('name', '==', sessionTypeName)
    .limit(1)
    .get();

  if (!typeQuery.empty) {
    const sessionType = { id: typeQuery.docs[0].id, ...typeQuery.docs[0].data() };
    return { success: true, data: sessionType };
  }

  // Create new sessionType with AI marker
  const now = admin.firestore.Timestamp.now();
  const typeData = {
    name: sessionTypeName,
    description: '🤖 由AI助手自动创建',
    userId,
    createdAt: now,
    updatedAt: now,
    createdByAI: true, // AI创建标记
    aiGeneratedAt: now, // AI创建时间
  };

  const docRef = await db.collection('sessionTypes').add(cleanUndefinedValues(typeData));
  const sessionType = { id: docRef.id, ...typeData };

  logger.info('Auto-created sessionType', { sessionTypeName, sessionTypeId: docRef.id });

  return { success: true, data: sessionType };
}

/**
 * Helper: Find or create rate
 */
async function findOrCreateRate(
  clientId: string,
  amount: number,
  currency: string,
  context: ExecutionContext
): Promise<MCPExecutionResult> {
  const { db, userId } = context;

  // Simplified query - search for existing rate (without complex index)
  const rateQuery = await db
    .collection('rates')
    .where('userId', '==', userId)
    .where('clientId', '==', clientId)
    .limit(10)
    .get();

  // Filter in memory for matching amount
  const matchingRate = rateQuery.docs.find(doc => {
    const data = doc.data();
    return data.amount === amount && data.currency === currency;
  });

  if (matchingRate) {
    const rate = { id: matchingRate.id, ...matchingRate.data() };
    return { success: true, data: rate };
  }

  // Create new rate with AI marker
  const now = admin.firestore.Timestamp.now();
  const rateData = {
    clientId,
    amount,
    currency,
    category: 'General',
    effectiveDate: now,
    description: '🤖 由AI助手自动创建',
    userId,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    createdByAI: true, // AI创建标记
    aiGeneratedAt: now, // AI创建时间
  };

  const docRef = await db.collection('rates').add(cleanUndefinedValues(rateData));
  const rate = { id: docRef.id, ...rateData };

  logger.info('Auto-created rate', { clientId, amount, rateId: docRef.id });

  return { success: true, data: rate };
}

/**
 * Aggregate entities (sum, count, avg, min, max)
 */
async function aggregateEntity(
  command: MCPCommand,
  context: ExecutionContext
): Promise<MCPExecutionResult> {
  const { entity: _entity, aggregations } = command;
  const { db: _db, userId: _userId, userRole: _userRole } = context;

  try {
    if (!aggregations || aggregations.length === 0) {
      return {
        success: false,
        error: 'No aggregations specified',
      };
    }

    // First, search for entities matching conditions
    const searchResult = await searchEntity(command, context);
    
    if (!searchResult.success || !searchResult.data) {
      return {
        success: false,
        error: 'Failed to retrieve data for aggregation',
      };
    }

    const items = searchResult.data;
    if (items.length === 0) {
      return {
        success: true,
        data: {
          count: 0,
          aggregations: aggregations.map(agg => ({
            function: agg.function,
            field: agg.field,
            result: agg.function === 'count' ? 0 : null,
          })),
        },
      };
    }

    // Calculate aggregations
    const results: any = {
      count: items.length,
      aggregations: [],
    };

    for (const agg of aggregations) {
      const { function: func, field } = agg;
      const values = items.map((item: any) => {
        const val = item[field];
        return typeof val === 'number' ? val : parseFloat(val) || 0;
      }).filter((v: any) => !isNaN(v));

      let result: number | null = null;

      switch (func) {
        case 'sum':
          result = values.reduce((a: any, b: any) => a + b, 0);
          break;
        case 'count':
          result = values.length;
          break;
        case 'avg':
          result = values.length > 0 ? values.reduce((a: any, b: any) => a + b, 0) / values.length : 0;
          break;
        case 'min':
          result = values.length > 0 ? Math.min(...values) : null;
          break;
        case 'max':
          result = values.length > 0 ? Math.max(...values) : null;
          break;
      }

      results.aggregations.push({
        function: func,
        field,
        result,
      });
    }

    logger.info('Aggregation completed', {
      entity: _entity,
      itemCount: items.length,
      aggregationCount: aggregations.length,
    });

    return {
      success: true,
      data: results,
    };
  } catch (error) {
    logger.error('Aggregation failed', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Aggregation failed',
    };
  }
}

/**
 * Helper: Get Firestore collection name for entity
 */
function getCollectionName(entity: MCPEntity): string {
  const collectionMap: Record<MCPEntity, string> = {
    client: 'clients',
    session: 'sessions',
    rate: 'rates',
    invoice: 'invoices',
    sessionType: 'sessionTypes',
    clientType: 'clientTypes',
    expense: 'expenses',
    expenseCategory: 'expenseCategories',
    knowledgeBase: 'knowledgeBase',
  };

  return collectionMap[entity] || entity + 's';
}

