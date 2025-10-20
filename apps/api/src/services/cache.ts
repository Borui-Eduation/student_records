/**
 * 混合缓存系统 - 结合内存缓存和Firestore缓存
 * 用途：在Free Tier下替代Redis，优化性能和降低Firestore成本
 * 
 * 缓存策略：
 * 1. L1 缓存 (内存): 热数据，快速访问，5-30分钟TTL
 * 2. L2 缓存 (Firestore): 冷数据，持久化，1-7天TTL
 */

import * as admin from 'firebase-admin';
import { createLogger } from '@student-record/shared';
import { cleanUndefinedValues } from './firestoreHelpers';

const logger = createLogger('cache-service');

// 内存缓存（L1）
class MemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 每5分钟清理过期数据
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set(key: string, value: any, ttlMinutes: number = 5): void {
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    this.cache.set(key, { value, expiresAt });
    logger.debug('Memory cache SET', { key, ttlMinutes });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      logger.debug('Memory cache cleanup', { cleanedCount });
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Firestore缓存（L2）
class FirestoreCache {
  private db: admin.firestore.Firestore;
  private cacheCollection = 'appCache';

  constructor(db: admin.firestore.Firestore) {
    this.db = db;
  }

  async set(key: string, value: any, ttlDays: number = 1): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ttlDays);

      await this.db.collection(this.cacheCollection).doc(key).set(cleanUndefinedValues({
        value,
        expiresAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }));

      logger.debug('Firestore cache SET', { key, ttlDays });
    } catch (error) {
      logger.error('Firestore cache SET failed', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async get(key: string): Promise<any> {
    try {
      const doc = await this.db.collection(this.cacheCollection).doc(key).get();

      if (!doc.exists) return null;

      const data = doc.data();
      if (!data) return null;

      // 检查过期
      const expiresAt = data.expiresAt?.toDate?.();
      if (expiresAt && new Date() > expiresAt) {
        await this.delete(key);
        return null;
      }

      return data.value;
    } catch (error) {
      logger.error('Firestore cache GET failed', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.db.collection(this.cacheCollection).doc(key).delete();
      logger.debug('Firestore cache DELETE', { key });
    } catch (error) {
      logger.error('Firestore cache DELETE failed', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async cleanup(): Promise<void> {
    try {
      const now = new Date();
      const batch = this.db.batch();
      const expired = await this.db
        .collection(this.cacheCollection)
        .where('expiresAt', '<', now)
        .limit(100)
        .get();

      for (const doc of expired.docs) {
        batch.delete(doc.ref);
      }

      if (expired.size > 0) {
        await batch.commit();
        logger.info('Firestore cache cleanup', { deletedCount: expired.size });
      }
    } catch (error) {
      logger.error('Firestore cache cleanup failed', error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// 统一的缓存接口
export class HybridCache {
  private memoryCache: MemoryCache;
  private firestoreCache: FirestoreCache;

  constructor(db: admin.firestore.Firestore) {
    this.memoryCache = new MemoryCache();
    this.firestoreCache = new FirestoreCache(db);
  }

  /**
   * 获取缓存值 (L1 -> L2 -> null)
   */
  async get<T>(key: string): Promise<T | null> {
    // 先检查内存缓存
    const memValue = this.memoryCache.get(key);
    if (memValue !== null) {
      logger.debug('Cache HIT (memory)', { key });
      return memValue;
    }

    // 再检查Firestore缓存
    const fsValue = await this.firestoreCache.get(key);
    if (fsValue !== null) {
      logger.debug('Cache HIT (firestore)', { key });
      // 回填到内存缓存
      this.memoryCache.set(key, fsValue, 5);
      return fsValue;
    }

    logger.debug('Cache MISS', { key });
    return null;
  }

  /**
   * 设置缓存 (同时写入L1和L2)
   */
  async set<T>(key: string, value: T, options: { memoryTtl?: number; firestoreTtl?: number } = {}): Promise<void> {
    const { memoryTtl = 5, firestoreTtl = 1 } = options;

    // 写入内存缓存
    this.memoryCache.set(key, value, memoryTtl);

    // 异步写入Firestore缓存
    this.firestoreCache.set(key, value, firestoreTtl).catch(error => {
      logger.warn('Failed to set Firestore cache', { error: error instanceof Error ? error.message : String(error) });
    });
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.firestoreCache.delete(key);
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    // Firestore清空在cleanup时处理
  }

  /**
   * 清理过期数据（定期运行）
   */
  async cleanup(): Promise<void> {
    await this.firestoreCache.cleanup();
  }

  /**
   * 销毁缓存（应用关闭时调用）
   */
  destroy(): void {
    this.memoryCache.destroy();
  }
}

// 全局缓存实例
let globalCache: HybridCache | null = null;

/**
 * 获取全局缓存实例
 */
export function getCache(): HybridCache {
  if (!globalCache) {
    const db = admin.firestore();
    globalCache = new HybridCache(db);
  }
  return globalCache;
}

/**
 * 缓存装饰器 - 用于缓存函数返回值
 */
export function Cacheable(options: { key: string; ttl?: number; memoryTtl?: number }) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = getCache();
      const cacheKey = `${options.key}:${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原始函数
      const result = await originalMethod.apply(this, args);

      // 写入缓存
      await cache.set(result, { memoryTtl: options.memoryTtl, firestoreTtl: options.ttl });

      return result;
    };

    return descriptor;
  };
}
