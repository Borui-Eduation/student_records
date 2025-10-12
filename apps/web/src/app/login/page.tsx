'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="w-full max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl space-y-4 sm:space-y-6 md:space-y-8">
        {/* Logo/Title Section */}
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            学生记录
            <br />
            管理系统
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Student Record Management System
          </p>
          <p className="text-xs sm:text-sm md:text-base text-gray-500">
            Multi-Business Management Platform
            <br />
            <span className="text-xs sm:text-sm">Education & Technical Services</span>
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-2 sm:space-y-3 text-center pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold">用 Google 账号登录</CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg">
              Sign in with your Google account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5 pt-2">
            <Button
              onClick={signInWithGoogle}
              className="w-full h-12 sm:h-14 md:h-16 text-base sm:text-lg md:text-xl"
              size="lg"
            >
              <svg className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" viewBox="0 0 24 24">
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
              用 Google 账号登录
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm uppercase">
                <span className="bg-background px-2 sm:px-3 text-muted-foreground">
                  或
                </span>
              </div>
            </div>
            
            <div className="rounded-lg bg-muted/50 p-4 sm:p-5 md:p-6 text-center">
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                🔒 <strong>仅限管理员访问</strong>
                <br />
                <span className="text-xs sm:text-sm md:text-base">Admin access only</span>
              </p>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2 sm:mt-3">
                如需访问权限，请联系系统管理员
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-xs sm:text-sm md:text-base text-gray-500">
          <p>© 2025 Student Record Management System</p>
        </div>
      </div>
    </div>
  );
}


