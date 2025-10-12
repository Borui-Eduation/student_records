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
            // 数据在 5 分钟内被认为是新鲜的，不会自动重新获取
            staleTime: 5 * 60 * 1000, // 5 minutes
            // 数据在缓存中保留 10 分钟
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            // 失败后只重试 1 次
            retry: 1,
            // 禁用窗口焦点时自动重新获取（减少不必要的请求）
            refetchOnWindowFocus: false,
            // 禁用网络重连时自动重新获取
            refetchOnReconnect: false,
            // 禁用组件挂载时自动重新获取
            refetchOnMount: false,
          },
        },
      })
  );

  // Use useMemo instead of useState to ensure stable client reference
  const trpcClient = useMemo(() => getTRPCClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </trpc.Provider>
    </QueryClientProvider>
  );
}


