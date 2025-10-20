/**
 * AI Router - tRPC endpoints for AI assistant
 */

import { router, adminProcedure } from '../trpc';
import { z } from 'zod';
import { parseNaturalLanguage, validateWorkflow, generateSuggestions, generateAggregateResponse, generateQueryResultTitle, generateQueryResultTags } from '../services/aiService';
import { executeWorkflow } from '../services/mcpExecutor';
import type { MCPContext } from '@student-record/shared';
import { cleanUndefinedValues } from '../services/firestoreHelpers';
import * as admin from 'firebase-admin';
import { createLogger } from '@student-record/shared';

const logger = createLogger('ai-router');

// Schemas
const ChatInputSchema = z.object({
  input: z.string().min(1).max(1000),
  context: z.object({
    recentCommands: z.array(z.any()).optional(),
    currentDate: z.string().optional(),
    userPreferences: z.object({
      defaultCurrency: z.string().optional(),
      timezone: z.string().optional(),
    }).optional(),
  }).optional(),
});

const ExecuteInputSchema = z.object({
  workflow: z.object({
    commands: z.array(z.object({
      operation: z.enum(['create', 'read', 'update', 'delete', 'search', 'aggregate']),
      entity: z.enum(['client', 'session', 'rate', 'invoice', 'sessionType', 'clientType', 'expense', 'expenseCategory', 'knowledgeBase']),
      data: z.record(z.any()).optional(),
      conditions: z.record(z.any()).optional(),
      aggregations: z.array(z.object({
        function: z.enum(['sum', 'count', 'avg', 'min', 'max']),
        field: z.string(),
      })).optional(),
      metadata: z.object({
        confidence: z.number().optional(),
        originalInput: z.string().optional(),
        warnings: z.array(z.string()).optional(),
      }).optional(),
    })),
    description: z.string(),
    requiresConfirmation: z.boolean(),
  }),
});

const SuggestInputSchema = z.object({
  context: z.object({
    recentCommands: z.array(z.any()).optional(),
    currentDate: z.string().optional(),
    userPreferences: z.object({
      defaultCurrency: z.string().optional(),
      timezone: z.string().optional(),
    }).optional(),
  }).optional(),
});

export const aiRouter = router({
  /**
   * Parse natural language input into structured commands
   */
  chat: adminProcedure
    .input(ChatInputSchema)
    .mutation(async ({ input }) => {
      // Build context
      const context: MCPContext = {
        recentCommands: input.context?.recentCommands || [],
        currentDate: input.context?.currentDate || new Date().toISOString().split('T')[0],
        userPreferences: input.context?.userPreferences || {
          defaultCurrency: 'CNY',
          timezone: 'Asia/Shanghai',
        },
      };

      // Parse natural language
      const parseResult = await parseNaturalLanguage(input.input, context);

      if (!parseResult.success || !parseResult.workflow) {
        return {
          success: false,
          error: parseResult.error,
          suggestions: parseResult.suggestions,
        };
      }

      // Validate workflow
      const validation = validateWorkflow(parseResult.workflow);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Workflow validation failed',
          suggestions: validation.errors,
        };
      }

      return {
        success: true,
        workflow: parseResult.workflow,
      };
    }),

  /**
   * Execute a parsed and confirmed workflow
   */
  execute: adminProcedure
    .input(ExecuteInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { workflow } = input;

      // Execute workflow
      const result = await executeWorkflow(workflow, {
        db: ctx.db,
        userId: ctx.user.uid,
        userRole: ctx.userRole,
      });

      // For aggregate operations, generate natural language response
      let naturalResponse: string | undefined;
      if (result.success && workflow.commands.length > 0) {
        const lastCommand = workflow.commands[workflow.commands.length - 1];
        if (lastCommand.operation === 'aggregate' && result.data && Array.isArray(result.data)) {
          // result.data is an array of command results, get the last one
          const aggregateResult = result.data[result.data.length - 1];
          naturalResponse = generateAggregateResponse(
            lastCommand.metadata?.originalInput || '',
            aggregateResult,
            lastCommand.entity,
            lastCommand.conditions
          );
          
          // Auto-save query result to Knowledge Base
          try {
            const title = generateQueryResultTitle(
              lastCommand.metadata?.originalInput || 'AI查询',
              lastCommand.operation,
              lastCommand.entity
            );
            
            const tags = generateQueryResultTags(
              lastCommand.operation,
              lastCommand.entity,
              lastCommand.conditions
            );
            
            const content = `查询时间: ${new Date().toLocaleString('zh-CN')}

用户问题: ${lastCommand.metadata?.originalInput || ''}

查询结果:
${naturalResponse}

原始数据:
${JSON.stringify(aggregateResult, null, 2)}`;
            
            await ctx.db.collection('knowledgeBase').add(cleanUndefinedValues({
              userId: ctx.user.uid,
              title,
              type: 'query-result',
              content,
              isEncrypted: false,
              tags,
              category: 'AI查询历史',
              attachments: [],
              accessCount: 0,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: ctx.user.uid,
            }));
            
            logger.info('Query result auto-saved to Knowledge Base', { 
              userId: ctx.user.uid, 
              title 
            });
          } catch (error) {
            // Don't fail the main request if save fails
            logger.error('Failed to auto-save query result', error instanceof Error ? error : new Error(String(error)));
          }
        }
      }

      return {
        ...result,
        naturalResponse,
      };
    }),

  /**
   * Get suggestions based on user context
   */
  suggest: adminProcedure
    .input(SuggestInputSchema)
    .query(async ({ input }) => {
      const context: MCPContext = {
        recentCommands: input.context?.recentCommands || [],
        currentDate: input.context?.currentDate || new Date().toISOString().split('T')[0],
        userPreferences: input.context?.userPreferences || {
          defaultCurrency: 'CNY',
          timezone: 'Asia/Shanghai',
        },
      };

      const suggestions = await generateSuggestions(context);

      return {
        suggestions,
      };
    }),

  /**
   * Get AI assistant status and configuration
   */
  status: adminProcedure
    .query(async () => {
      const isConfigured = !!process.env.GEMINI_API_KEY;

      return {
        enabled: isConfigured,
        model: 'gemini-2.5-flash',
        features: {
          naturalLanguageParsing: true,
          autoCreateEntities: true,
          multiStepOperations: true,
          contextualSuggestions: true,
        },
      };
    }),
});

