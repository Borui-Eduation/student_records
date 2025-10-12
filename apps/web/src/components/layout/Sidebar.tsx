'use client';

import { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Lock,
  Share2,
  Building2,
  DollarSign,
  Receipt,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Clients',
    href: '/dashboard/clients',
    icon: Users,
  },
  {
    title: 'Rates',
    href: '/dashboard/rates',
    icon: DollarSign,
  },
  {
    title: 'Sessions',
    href: '/dashboard/sessions',
    icon: Calendar,
  },
  {
    title: 'Invoices',
    href: '/dashboard/invoices',
    icon: FileText,
  },
  {
    title: 'Expenses',
    href: '/dashboard/expenses',
    icon: Receipt,
  },
  {
    title: 'Knowledge Base',
    href: '/dashboard/knowledge',
    icon: Lock,
  },
  {
    title: 'Sharing Links',
    href: '/dashboard/sharing',
    icon: Share2,
  },
  {
    title: 'Company Profile',
    href: '/dashboard/profile',
    icon: Building2,
  },
  {
    title: 'User Management',
    href: '/dashboard/users',
    icon: Shield,
    superAdminOnly: true,
  },
];

// Context for sidebar state
const SidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

function SidebarNav({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { userRole } = useAuth();

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => {
    if ('superAdminOnly' in item && item.superAdminOnly) {
      return userRole === 'superadmin';
    }
    return true;
  });

  return (
    <nav className="flex-1 space-y-1 p-4">
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const { isOpen, setIsOpen } = useSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden w-64 border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-6">
            <h1 className="text-lg font-semibold">Student Record</h1>
          </div>
          <SidebarNav />
        </div>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-6">
              <h1 className="text-lg font-semibold">Student Record</h1>
            </div>
            <SidebarNav onLinkClick={() => setIsOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}


