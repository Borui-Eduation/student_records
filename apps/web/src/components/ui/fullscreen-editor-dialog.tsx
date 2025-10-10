'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Save } from 'lucide-react';

interface FullscreenEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
}

export function FullscreenEditorDialog({
  open,
  onOpenChange,
  title,
  children,
  onSave,
}: FullscreenEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] max-h-[98vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Maximize2 className="h-5 w-5" />
              {title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {onSave && (
                <Button onClick={onSave} size="sm" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  💾 保存并关闭 Save & Close
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
                title="关闭 Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-0 m-0">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

