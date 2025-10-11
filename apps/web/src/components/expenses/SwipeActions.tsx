'use client';

import { ReactNode, useRef, useState } from 'react';
import { Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeActionsProps {
  children: ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

export function SwipeActions({
  children,
  onDelete,
  onEdit,
  className,
}: SwipeActionsProps) {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_SWIPE = -120; // Maximum left swipe distance

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;

    currentX.current = e.touches[0].clientX;
    const deltaX = currentX.current - startX.current;

    // Only allow left swipe (negative values)
    if (deltaX < 0) {
      const newOffset = Math.max(deltaX, MAX_SWIPE);
      setOffset(newOffset);
    } else if (offset < 0) {
      // Allow swiping back to the right to close
      const newOffset = Math.min(offset + deltaX, 0);
      setOffset(newOffset);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    // If swiped more than 60px, snap to open position
    if (offset < -60) {
      setOffset(MAX_SWIPE);
    } else {
      setOffset(0);
    }
  };

  const handleActionClick = (action: () => void) => {
    action();
    setOffset(0); // Reset swipe after action
  };

  return (
    <div className={cn('relative overflow-hidden', className)} ref={containerRef}>
      {/* Action Buttons (Hidden behind) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-2">
        {onEdit && (
          <button
            onClick={() => handleActionClick(onEdit)}
            className="bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center min-w-[60px] h-full"
          >
            <Edit className="h-5 w-5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => handleActionClick(onDelete)}
            className="bg-red-500 text-white p-3 rounded-lg flex items-center justify-center min-w-[60px] h-full"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Swipeable Content */}
      <div
        className="relative bg-white transition-transform duration-200"
        style={{
          transform: `translateX(${offset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

