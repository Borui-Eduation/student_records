'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Sidebar, SidebarProvider } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { trpc } from '@/lib/trpc';
import { AIAssistantDialog } from '@/components/AIAssistant';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

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

      {/* AI Assistant Floating Button */}
      <Button
        onClick={() => setAiAssistantOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all hover:scale-110 z-30 bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
        size="icon"
      >
        <Sparkles className="w-6 h-6" />
        <span className="sr-only">打开 AI 助手（快捷键: Ctrl+K）</span>
      </Button>

      {/* AI Assistant Dialog */}
      <AIAssistantDialog
        open={aiAssistantOpen}
        onOpenChange={setAiAssistantOpen}
      />
    </SidebarProvider>
  );
}


