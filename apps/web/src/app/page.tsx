'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="z-10 max-w-5xl w-full items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-12 text-center">
          <h1 className="text-5xl font-bold text-center mb-4 text-gray-900">
            专业工作空间
          </h1>
          <p className="text-xl text-center text-gray-600 mb-2">
            Professional Workspace
          </p>
          <div className="mt-8 mb-10">
            <p className="text-lg text-gray-700 font-medium">Multi-Business Management Platform</p>
            <p className="text-sm text-gray-500 mt-2">
              Education & Technical Services
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <Button 
              onClick={signInWithGoogle}
              size="lg"
              className="w-full max-w-md mx-auto text-lg py-6"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              使用 Google 账号登录
            </Button>
            
            <p className="text-xs text-gray-500 mt-4">
              请使用授权的 Google 账号登录
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📊 财务管理</h3>
                <p className="text-sm text-gray-600">多费率自动开票，精准核算</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📝 课时日志</h3>
                <p className="text-sm text-gray-600">结构化内容记录</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">🔐 知识库</h3>
                <p className="text-sm text-gray-600">加密存储，安全可靠</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


