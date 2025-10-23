/**
 * 动态查询路由 - tRPC endpoints for dynamic AI-generated queries
 */

import { router, adminProcedure } from '../trpc';
import { z } from 'zod';
import { generateDynamicQuery, executeDynamicQueries } from '../services/dynamicQueryGenerator';
import { getRateLimiter } from '../services/geminiRateLimiter';
import { createLogger } from '@professional-workspace/shared';

const logger = createLogger('dynamic-query-router');

const DynamicQueryInputSchema = z.object({
  prompt: z.string().min(1).max(500),
});

export const dynamicQueryRouter = router({
  /**
   * 根据用户 prompt 生成并执行动态查询
   */
  execute: adminProcedure
    .input(DynamicQueryInputSchema)
    .mutation(async ({ input, ctx }) => {
      const rateLimiter = getRateLimiter();

      try {
        logger.info('Dynamic query request', { prompt: input.prompt, userId: ctx.user.uid });

        // 生成查询操作
        const genResult = await rateLimiter.executeWithRateLimit(
          () => generateDynamicQuery(input.prompt, ctx.user.uid),
          'high'
        );

        if (!genResult.success || !genResult.operations) {
          logger.warn('Failed to generate query', { error: genResult.error });
          return {
            success: false,
            error: genResult.error || 'Failed to generate query',
          };
        }

        logger.info('Query generated', { operationCount: genResult.operations.length });

        // 执行查询
        const execResult = await executeDynamicQueries(
          genResult.operations,
          ctx.db,
          ctx.user.uid
        );

        if (!execResult.success) {
          logger.error('Failed to execute query', { error: execResult.error });
          return {
            success: false,
            error: execResult.error || 'Failed to execute query',
          };
        }

        logger.info('Query executed successfully', { resultCount: execResult.results?.length });

        return {
          success: true,
          explanation: genResult.explanation,
          results: execResult.results,
          aggregations: execResult.aggregationResults,
        };
      } catch (error) {
        logger.error('Dynamic query endpoint error', error instanceof Error ? error : new Error(String(error)));
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * 只生成查询不执行（用于预览）
   */
  generate: adminProcedure
    .input(DynamicQueryInputSchema)
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Generate-only query request', { prompt: input.prompt });

        const result = await generateDynamicQuery(input.prompt, ctx.user.uid);

        if (!result.success) {
          return {
            success: false,
            error: result.error,
          };
        }

        return {
          success: true,
          operations: result.operations,
          explanation: result.explanation,
        };
      } catch (error) {
        logger.error('Generate query error', error instanceof Error ? error : new Error(String(error)));
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
});


