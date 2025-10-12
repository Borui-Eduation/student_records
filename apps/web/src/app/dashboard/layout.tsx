'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Sidebar, SidebarProvider } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { trpc } from '@/lib/trpc';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  // Get or create current user
  const { data: currentUser } = trpc.users.getCurrentUser.useQuery(undefined, {
    enabled: !!user,
  });

  // Initialize user mutation
  const initializeUserMutation = trpc.users.initializeUser.useMutation();

  // Auto-initialize user if needed
  useEffect(() => {
    if (currentUser && 'isInitialized' in currentUser && !currentUser.isInitialized) {
      initializeUserMutation.mutate();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // Redirect non-admin users back to login
    if (!loading && user && userRole && userRole !== 'admin' && userRole !== 'superadmin') {
      router.push('/login');
    }
  }, [user, userRole, loading, router]);

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

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-3 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


