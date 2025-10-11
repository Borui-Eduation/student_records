import { useState, useCallback } from 'react';

export interface Toast {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Simple toast implementation
let toastCallback: ((toast: Toast) => void) | null = null;

export function useToast() {
  const [, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: Toast) => {
    // Simple alert for now - can be enhanced with proper UI component
    const message = options.description 
      ? `${options.title}\n${options.description}` 
      : options.title;
    
    if (options.variant === 'destructive') {
      console.error(message);
      alert(`错误: ${message}`);
    } else {
      console.log(message);
      alert(message);
    }
    
    return {
      id: Date.now().toString(),
      dismiss: () => {},
    };
  }, []);

  return { toast };
}



