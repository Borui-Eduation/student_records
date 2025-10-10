'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useSidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Menu } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();
  const { setIsOpen } = useSidebar();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-3 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>

        {/* Title - responsive */}
        <h2 className="text-sm font-medium text-muted-foreground hidden sm:block">
          Multi-Business Management Platform
        </h2>
        <h2 className="text-sm font-medium text-muted-foreground sm:hidden">
          Student Record
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-9">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden md:inline max-w-[150px] truncate">{user?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}


