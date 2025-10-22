'use client';

import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
}

export function FloatingActionButton({ onClick, label = '添加费用' }: FloatingActionButtonProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide FAB when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-20 right-4 z-20',
        'bg-blue-600 hover:bg-blue-700',
        'text-white',
        'rounded-full shadow-lg',
        'flex items-center gap-2',
        'px-6 py-4',
        'transition-all duration-300',
        'md:hidden', // Only show on mobile
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      )}
      style={{
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
      }}
    >
      <Plus className="h-6 w-6" />
      <span className="font-medium">{label}</span>
    </button>
  );
}




