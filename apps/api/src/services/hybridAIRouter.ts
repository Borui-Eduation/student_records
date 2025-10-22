/**
 * 混合 AI 路由器
 * 智能选择使用 MCP 系统或动态查询系统
 * 
 * 策略:
 * 1. 优先尝试 MCP (稳定、经过验证)
 * 2. MCP 不支持时，降级到动态查询系统
 * 3. 自动学习和优化路由决策
 */

import { createLogger } from '@professional-workspace/shared';
import type { MCPParseResult, MCPWorkflow, MCPContext } from '@professional-workspace/shared';
import { parseNaturalLanguage as mcpParse, validateWorkflow } from './aiService';
import { generateDynamicQuery, executeDynamicQueries } from './dynamicQueryGenerator';
import * as admin from 'firebase-admin';

const logger = createLogger('hybrid-ai-router');

export interface HybridAIResult {
  success: boolean;
  usedSystem: 'mcp' | 'dynamic';
  workflow?: MCPWorkflow;
  results?: any[];
  aggregations?: Record<string, any>;
  explanation?: string;
  error?: string;
  suggestions?: string[];
  fallbackReason?: string;
}

/**
 * 检测 MCP 是否支持该查询
 */
function isMCPSupported(parseResult: MCPParseResult): boolean {
  if (!parseResult.success || !parseResult.workflow) {
    return false;
  }

  const workflow = parseResult.workflow;

  // MCP 不支持的情况
  const unsupportedPatterns = [
    // 复杂聚合（多字段 GROUP BY）
    workflow.commands.some(cmd => 
      cmd.operation === 'aggregate' && 
      cmd.aggregations && 
      cmd.aggregations.length > 2
    ),
    
    // 复杂的多条件筛选（3+ 个条件）
    workflow.commands.some(cmd => 
      cmd.conditions && 
      Object.keys(cmd.conditions).length > 3
    ),
    
    // 带范围查询的复杂排序
    workflow.commands.some(cmd => 
      cmd.conditions?.dateRange && 
      cmd.operation === 'search' &&
      Object.keys(cmd.conditions).length > 2
    ),
  ];

  // 如果有任何不支持的模式，返回 false
  if (unsupportedPatterns.some(pattern => pattern)) {
    logger.info('MCP 不支持该查询模式，将降级到动态查询');
    return false;
  }

  // 验证 workflow
  const validation = validateWorkflow(workflow);
  if (!validation.valid) {
    logger.warn('MCP workflow 验证失败', { errors: validation.errors });
    return false;
  }

  return true;
}

/**
 * 混合 AI 解析和执行
 */
export async function hybridAIParse(
  userInput: string,
  context: MCPContext,
  db: admin.firestore.Firestore,
  userId: string
): Promise<HybridAIResult> {
  try {
    logger.info('混合 AI 路由开始', { input: userInput, userId });

    // 步骤 0: 智能预测最佳系统（避免不必要的 MCP 调用）
    const predicted = predictBestSystem(userInput);
    
    // 如果预测为动态查询且关键词强烈匹配，直接跳到动态查询
    const hasStrongDynamicKeywords = /group by|分组|top \d+|前\d+|每个.*的|各个.*的|按照.*分组/i.test(userInput);
    
    if (predicted === 'dynamic' && hasStrongDynamicKeywords) {
      logger.info('⚡ 智能路由：直接使用动态查询系统（跳过 MCP）');
      
      const dynamicResult = await generateDynamicQuery(userInput, userId);
      
      if (!dynamicResult.success || !dynamicResult.operations) {
        logger.error('动态查询生成失败', { error: dynamicResult.error });
        return {
          success: false,
          usedSystem: 'dynamic',
          error: dynamicResult.error || 'AI 无法理解您的问题',
          suggestions: [
            '请尝试更清晰地描述您的需求',
            '例如: "获取本月所有课程"',
            '或: "统计每个客户的课程总金额"',
          ],
        };
      }
      
      const execResult = await executeDynamicQueries(
        dynamicResult.operations,
        db,
        userId
      );
      
      if (!execResult.success) {
        logger.error('动态查询执行失败', { error: execResult.error });
        return {
          success: false,
          usedSystem: 'dynamic',
          error: execResult.error,
        };
      }
      
      logger.info('✅ 动态查询成功（智能路由）', { resultCount: execResult.results?.length });
      
      return {
        success: true,
        usedSystem: 'dynamic',
        results: execResult.results,
        aggregations: execResult.aggregationResults,
        explanation: dynamicResult.explanation,
        fallbackReason: '智能路由预测：复杂查询',
      };
    }

    // 步骤 1: 尝试使用 MCP 系统（常规路径）
    logger.debug('尝试 MCP 解析...');
    const mcpResult = await mcpParse(userInput, context);

    // 步骤 2: 检查 MCP 是否支持
    const mcpSupported = isMCPSupported(mcpResult);

    if (mcpSupported && mcpResult.workflow) {
      logger.info('✅ 使用 MCP 系统', { commandCount: mcpResult.workflow.commands.length });
      
      return {
        success: true,
        usedSystem: 'mcp',
        workflow: mcpResult.workflow,
        explanation: mcpResult.workflow.description,
      };
    }

    // 步骤 3: MCP 不支持，降级到动态查询
    logger.info('⚡ MCP 不支持，降级到动态查询系统');
    
    const dynamicResult = await generateDynamicQuery(userInput, userId);

    if (!dynamicResult.success || !dynamicResult.operations) {
      logger.error('动态查询生成失败', { error: dynamicResult.error });
      return {
        success: false,
        usedSystem: 'dynamic',
        error: dynamicResult.error || 'AI 无法理解您的问题',
        suggestions: [
          '请尝试更清晰地描述您的需求',
          '例如: "获取本月所有课程"',
          '或: "统计每个客户的课程总金额"',
        ],
      };
    }

    // 步骤 4: 执行动态查询
    logger.debug('执行动态查询...', { operationCount: dynamicResult.operations.length });
    
    const execResult = await executeDynamicQueries(
      dynamicResult.operations,
      db,
      userId
    );

    if (!execResult.success) {
      logger.error('动态查询执行失败', { error: execResult.error });
      return {
        success: false,
        usedSystem: 'dynamic',
        error: execResult.error,
      };
    }

    logger.info('✅ 动态查询成功', { resultCount: execResult.results?.length });

    return {
      success: true,
      usedSystem: 'dynamic',
      results: execResult.results,
      aggregations: execResult.aggregationResults,
      explanation: dynamicResult.explanation,
      fallbackReason: mcpResult.error || 'MCP 不支持此类复杂查询',
    };

  } catch (error) {
    logger.error('混合 AI 路由失败', error instanceof Error ? error : new Error(String(error)));
    
    return {
      success: false,
      usedSystem: 'mcp', // 默认标记为 mcp
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestions: [
        '系统遇到错误，请稍后重试',
        '或联系管理员获取帮助',
      ],
    };
  }
}

/**
 * 分析用户输入，提前判断应该用哪个系统
 * (可选优化: 避免双重 AI 调用)
 */
export function predictBestSystem(userInput: string): 'mcp' | 'dynamic' {
  const input = userInput.toLowerCase();

  // 动态查询关键词
  const dynamicKeywords = [
    'group by', '分组',
    'top', '前', '最', 
    'avg', 'average', '平均',
    'min', 'max', '最小', '最大',
    '每个', '各个', '按照',
    '复杂', 'complex',
  ];

  // MCP 关键词
  const mcpKeywords = [
    '添加', '创建', 'add', 'create',
    '更新', '修改', 'update', 'modify',
    '删除', 'delete', 'remove',
    '显示', '查询', 'show', 'list', 'search',
  ];

  // 检测动态查询关键词
  const hasDynamicKeywords = dynamicKeywords.some(kw => input.includes(kw));
  const hasMCPKeywords = mcpKeywords.some(kw => input.includes(kw));

  // 决策逻辑
  if (hasDynamicKeywords && !hasMCPKeywords) {
    return 'dynamic';
  }

  // 默认使用 MCP (更稳定)
  return 'mcp';
}

/**
 * 记录系统选择，用于后续优化
 */
export async function logSystemChoice(
  userInput: string,
  usedSystem: 'mcp' | 'dynamic',
  success: boolean,
  db: admin.firestore.Firestore,
  userId: string
): Promise<void> {
  try {
    await db.collection('aiSystemLogs').add({
      userId,
      userInput,
      usedSystem,
      success,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error('记录系统选择失败', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * 获取系统使用统计
 */
export async function getSystemStats(
  db: admin.firestore.Firestore,
  userId: string,
  days: number = 7
): Promise<{
  mcpCount: number;
  dynamicCount: number;
  mcpSuccessRate: number;
  dynamicSuccessRate: number;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db
      .collection('aiSystemLogs')
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .get();

    let mcpCount = 0;
    let mcpSuccess = 0;
    let dynamicCount = 0;
    let dynamicSuccess = 0;

    logs.docs.forEach(doc => {
      const data = doc.data();
      if (data.usedSystem === 'mcp') {
        mcpCount++;
        if (data.success) mcpSuccess++;
      } else {
        dynamicCount++;
        if (data.success) dynamicSuccess++;
      }
    });

    return {
      mcpCount,
      dynamicCount,
      mcpSuccessRate: mcpCount > 0 ? (mcpSuccess / mcpCount) * 100 : 0,
      dynamicSuccessRate: dynamicCount > 0 ? (dynamicSuccess / dynamicCount) * 100 : 0,
    };
  } catch (error) {
    logger.error('获取系统统计失败', error instanceof Error ? error : new Error(String(error)));
    return {
      mcpCount: 0,
      dynamicCount: 0,
      mcpSuccessRate: 0,
      dynamicSuccessRate: 0,
    };
  }
}

