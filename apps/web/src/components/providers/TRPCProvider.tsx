'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { trpc, getTRPCClient } from '@/lib/trpc';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 优化缓存策略 - 适应免费额度限制
            staleTime: 5 * 60 * 1000, // 5分钟内数据被认为是新鲜的
            gcTime: 15 * 60 * 1000, // 15分钟内保留缓存 (从10分钟增加到15分钟)
            // 失败重试策略
            retry: 2, // 失败重试2次（增加可靠性）
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数退避
            // 禁用自动重新获取，减少Firestore读取
            refetchOnWindowFocus: false, // 窗口获焦时不重新获取
            refetchOnReconnect: false, // 网络重连时不重新获取
            refetchOnMount: false, // 组件挂载时不重新获取
          },
          mutations: {
            // 变更请求重试策略
            retry: 1, // 变更失败重试1次
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
          },
        },
      })
  );

  // 使用useMemo确保稳定的客户端引用
  const trpcClient = useMemo(() => getTRPCClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </trpc.Provider>
    </QueryClientProvider>
  );
}


