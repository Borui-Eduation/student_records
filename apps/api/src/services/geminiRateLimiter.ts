/**
 * Gemini API 速率限制器
 * 处理Gemini Free Tier限制 (15请求/分钟)
 * 
 * 功能：
 * 1. 请求队列管理
 * 2. 速率限制跟踪
 * 3. 指数退避重试
 * 4. 降级处理（当超出限制时）
 */

import { createLogger } from '@professional-workspace/shared';
import type { MCPParseResult } from '@professional-workspace/shared';

const logger = createLogger('gemini-rate-limiter');

// Free Tier 限制：15请求/分钟
const RATE_LIMIT_REQUESTS = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分钟
const MAX_QUEUE_SIZE = 100;
const REQUEST_TIMEOUT_MS = 30000; // 30秒

interface QueuedRequest {
  id: string;
  execute: () => Promise<MCPParseResult>;
  createdAt: number;
  priority: 'high' | 'normal' | 'low';
  retries: number;
  maxRetries: number;
}

interface RateLimitInfo {
  requestCount: number;
  windowStart: number;
  lastRequestTime: number;
}

export class GeminiRateLimiter {
  private queue: QueuedRequest[] = [];
  private rateLimitInfo: RateLimitInfo = {
    requestCount: 0,
    windowStart: Date.now(),
    lastRequestTime: 0,
  };
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;
  private requestIdCounter = 0;

  constructor() {
    // 每500ms处理一次队列
    this.processInterval = setInterval(() => this.processQueue(), 500);
  }

  /**
   * 添加请求到队列
   */
  async executeWithRateLimit<T>(
    execute: () => Promise<T>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    const requestId = `req-${++this.requestIdCounter}`;

    // 检查队列大小
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      logger.warn('Request queue full, rejecting request', { requestId, queueSize: this.queue.length });
      throw new Error('AI service is too busy. Please try again later.');
    }

    // 创建请求包装
    const wrappedExecute = async () => {
      try {
        const result = await Promise.race([
          execute(),
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS)
          ),
        ]);
        return result;
      } catch (error) {
        if (error instanceof Error && error.message.includes('429')) {
          logger.warn('Rate limit hit', { requestId });
          throw new RateLimitError('Rate limit exceeded');
        }
        throw error;
      }
    };

    // 添加到队列
    const queuedRequest: QueuedRequest = {
      id: requestId,
      execute: wrappedExecute as any,
      createdAt: Date.now(),
      priority,
      retries: 0,
      maxRetries: 3,
    };

    this.queue.push(queuedRequest);

    // 按优先级排序
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    logger.debug('Request queued', { requestId, queueSize: this.queue.length, priority });

    // 等待请求完成
    return new Promise((_resolve, reject) => {
      const checkCompletion = setInterval(() => {
        const request = this.queue.find(r => r.id === requestId);
        if (!request) {
          clearInterval(checkCompletion);
          // 请求已处理（从队列移除）
          // 实际结果通过其他机制返回
        }
      }, 100);

      // 设置超时
      setTimeout(() => {
        clearInterval(checkCompletion);
        const index = this.queue.findIndex(r => r.id === requestId);
        if (index !== -1) {
          this.queue.splice(index, 1);
          reject(new Error('Request timeout in queue'));
        }
      }, 60000); // 60秒总超时
    });
  }

  /**
   * 处理队列中的请求
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // 检查是否超过速率限制
      const now = Date.now();
      if (now - this.rateLimitInfo.windowStart >= RATE_LIMIT_WINDOW_MS) {
        // 新的时间窗口，重置计数
        this.rateLimitInfo.windowStart = now;
        this.rateLimitInfo.requestCount = 0;
      }

      // 如果在当前窗口内超过限制，等待
      if (this.rateLimitInfo.requestCount >= RATE_LIMIT_REQUESTS) {
        const waitTime = RATE_LIMIT_WINDOW_MS - (now - this.rateLimitInfo.windowStart);
        logger.debug('Rate limit reached, waiting', {
          waitMs: waitTime,
          queueSize: this.queue.length,
        });
        return;
      }

      // 处理下一个请求
      const request = this.queue.shift();
      if (!request) return;

      try {
        logger.debug('Executing queued request', { requestId: request.id, retries: request.retries });

        await request.execute();

        // 增加计数
        this.rateLimitInfo.requestCount++;
        this.rateLimitInfo.lastRequestTime = now;

        logger.debug('Request completed', {
          requestId: request.id,
          requestCount: this.rateLimitInfo.requestCount,
          remaining: RATE_LIMIT_REQUESTS - this.rateLimitInfo.requestCount,
        });
      } catch (error) {
        if (error instanceof RateLimitError) {
          // 速率限制，重新加入队列
          if (request.retries < request.maxRetries) {
            request.retries++;
            this.queue.unshift(request); // 重新加入队列前面
            logger.warn('Rate limit retry', { requestId: request.id, retries: request.retries });

            // 指数退避
            const backoffMs = Math.min(1000 * Math.pow(2, request.retries), 30000);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          } else {
            logger.error('Max retries exceeded for rate limit', { requestId: request.id });
          }
        } else {
          // 其他错误，放弃
          logger.error('Request failed', {
            requestId: request.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 获取当前速率限制状态
   */
  getStatus() {
    const now = Date.now();
    const timeInWindow = now - this.rateLimitInfo.windowStart;
    const timeRemaining = Math.max(0, RATE_LIMIT_WINDOW_MS - timeInWindow);

    return {
      requestsUsed: this.rateLimitInfo.requestCount,
      requestsRemaining: Math.max(0, RATE_LIMIT_REQUESTS - this.rateLimitInfo.requestCount),
      windowResetsIn: timeRemaining,
      queueSize: this.queue.length,
      isLimited: this.rateLimitInfo.requestCount >= RATE_LIMIT_REQUESTS,
    };
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = [];
    logger.info('Rate limiter queue cleared');
  }

  /**
   * 销毁并清理资源
   */
  destroy(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }
    this.clear();
  }
}

/**
 * 速率限制错误
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// 全局速率限制器实例
let globalRateLimiter: GeminiRateLimiter | null = null;

/**
 * 获取全局速率限制器实例
 */
export function getRateLimiter(): GeminiRateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new GeminiRateLimiter();
  }
  return globalRateLimiter;
}

/**
 * 清理全局实例（应用关闭时）
 */
export function destroyRateLimiter(): void {
  if (globalRateLimiter) {
    globalRateLimiter.destroy();
    globalRateLimiter = null;
  }
}
