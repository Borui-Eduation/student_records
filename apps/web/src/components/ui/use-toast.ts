import { useCallback } from 'react';

export interface Toast {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

// Simple toast implementation
export function useToast() {

  const toast = useCallback((options: Toast) => {
    // Simple alert for now - can be enhanced with proper UI component
    const message = options.description 
      ? `${options.title}\n${options.description}` 
      : options.title;
    
    if (options.variant === 'destructive') {
      // eslint-disable-next-line no-console
      console.error(message);
      alert(`错误: ${message}`);
    } else {
      // eslint-disable-next-line no-console
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



