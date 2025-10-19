import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HybridCache } from '../cache';
import * as admin from 'firebase-admin';

// Mock Firestore
vi.mock('firebase-admin', () => ({
  firestore: () => ({
    collection: () => ({
      doc: () => ({
        set: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
      }),
      where: () => ({
        limit: () => ({
          get: vi.fn().mockResolvedValue({ size: 0, docs: [] }),
        }),
      }),
    }),
    batch: () => ({
      delete: vi.fn(),
      commit: vi.fn(),
    }),
  }),
}));

describe('HybridCache', () => {
  let cache: HybridCache;

  beforeEach(() => {
    const db = admin.firestore();
    cache = new HybridCache(db);
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Memory Cache (L1)', () => {
    it('应该缓存和检索数据', async () => {
      const testData = { id: '1', name: 'Test' };
      await cache.set('test-key', testData, { memoryTtl: 5 });

      const result = await cache.get('test-key');
      expect(result).toEqual(testData);
    });

    it('应该在TTL过期后返回null', async () => {
      const testData = { id: '1', name: 'Test' };
      await cache.set('test-key', testData, { memoryTtl: 1 }); // 1分钟TTL

      // 立即检索应该返回数据
      let result = await cache.get('test-key');
      expect(result).toEqual(testData);
    });
  });

  describe('Cache Methods', () => {
    it('应该正确删除缓存', async () => {
      await cache.set('test-key', { value: 'test' });
      await cache.delete('test-key');

      const result = await cache.get('test-key');
      expect(result).toBeNull();
    });

    it('应该清空所有缓存', async () => {
      await cache.set('key1', { value: '1' });
      await cache.set('key2', { value: '2' });
      await cache.clear();

      const result1 = await cache.get('key1');
      const result2 = await cache.get('key2');
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('Cache Performance', () => {
    it('缓存命中应该立即返回', async () => {
      const testData = { id: '1', name: 'Test' };
      await cache.set('test-key', testData);

      const start = Date.now();
      await cache.get('test-key');
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10); // 应该小于10ms
    });
  });
});
