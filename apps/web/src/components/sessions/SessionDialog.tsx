'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateSessionSchema, type CreateSessionInput, type Client, type SessionType } from '@professional-workspace/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { FullscreenEditorDialog } from '@/components/ui/fullscreen-editor-dialog';
import { Maximize2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toDate } from '@/lib/utils';

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: import('@professional-workspace/shared').Session | null; // Existing session for edit mode
}

export function SessionDialog({ open, onOpenChange, session }: SessionDialogProps) {
  const utils = trpc.useUtils();
  const isEditMode = !!session;
  const [fullscreenMode, setFullscreenMode] = useState<'notes' | null>(null);
  

  // Get clients list
  const { data: clients } = trpc.clients.list.useQuery({
    active: true,
    limit: 100,
  });
  const clientItems = (clients?.items || []) as Client[];

  // Get session types list
  const { data: sessionTypes } = trpc.sessionTypes.list.useQuery({
    limit: 100,
  });
  const sessionTypeItems = (sessionTypes?.items || []) as SessionType[];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateSessionInput>({
    resolver: zodResolver(CreateSessionSchema),
    // Use session prop directly to set default values, leveraging the key prop on the parent to remount
    defaultValues: session ? {
      clientId: session.clientId,
      sessionTypeId: session.sessionTypeId,
      startTime: session.startTime,
      endTime: session.endTime,
      date: (() => {
        const date = toDate(session.date);
        return date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      })(),
      notes: session.notes || '',
    } : {
      date: new Date().toISOString().split('T')[0], // Default to today for new sessions
      clientId: '',
      sessionTypeId: '',
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
    }
  });

  // The useEffect for populating the form is no longer needed due to the key prop remount strategy

  const createMutation = trpc.sessions.create.useMutation({
    onSuccess: () => {
      console.log('✅ Session created successfully');
      utils.sessions.list.invalidate();
      onOpenChange(false);
    },
  });

  const updateMutation = trpc.sessions.update.useMutation({
    onSuccess: (updatedSession) => {
      console.log('✅ Session updated on backend, received:', updatedSession);

      const queryInput = { limit: 50 }; // This must match the input of the useQuery in SessionsPage

      // Manually update the tRPC cache to ensure the UI reflects the change immediately
      utils.sessions.list.setData(queryInput, (oldQueryData) => {
        if (!oldQueryData) {
          console.warn('Cache for sessions.list not found. A refetch will occur.');
          return oldQueryData;
        }

        console.log('Found cache. Manually updating session list...');
        const newItems = oldQueryData.items.map((item) => {
          if (item.id === updatedSession.id) {
            console.log(`Found session ${item.id} in cache. Replacing with new data. Old date: ${item.date}, New date: ${updatedSession.date}`);
            // The backend returns the full, updated session object, which we use to replace the stale item
            return updatedSession as (typeof oldQueryData.items)[number];
          }
          return item;
        });

        return { ...oldQueryData, items: newItems };
      });
      
      // Invalidate just in case, to ensure eventual consistency if the manual update fails
      utils.sessions.list.invalidate(queryInput);

      onOpenChange(false);
    },
    onError: (error) => {
      console.error('❌ Session update failed:', error);
    }
  });

  const onSubmit = async (data: CreateSessionInput) => {
    console.log('📤 Submitting session data:', { isEditMode, data });
    
    if (isEditMode && session) {
      // Only send fields that should be updated
      const updatePayload = {
        id: session.id,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        sessionTypeId: data.sessionTypeId,
        notes: data.notes,
      };
      console.log('📝 Update payload:', updatePayload);
      await updateMutation.mutateAsync(updatePayload);
    } else {
      console.log('➕ Create payload:', data);
      await createMutation.mutateAsync(data);
    }
  };

  const mutation = isEditMode ? updateMutation : createMutation;

  return (
    <>
      {/* Fullscreen Markdown Editor */}
      <FullscreenEditorDialog
        open={fullscreenMode === 'notes'}
        onOpenChange={(open) => !open && setFullscreenMode(null)}
        title="📝 笔记编辑器 / Markdown Notes Editor"
        onSave={() => setFullscreenMode(null)}
      >
        <MarkdownEditor
          value={watch('notes') || ''}
          onChange={(value) => {
            setValue('notes', value, { 
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true 
            });
          }}
          height="100%"
          preview="live"
          placeholder="# 上课记录

## 本节内容
- 讨论主题 1
- 讨论主题 2

## 作业/任务
- [ ] 任务 1
- [ ] 任务 2

## 备注
其他补充说明..."
        />
      </FullscreenEditorDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px]">
          <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Session' : 'Record New Session'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update session information and class notes'
                : 'Record a teaching or consulting session with detailed notes'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            {/* Client Selection */}
            <div className="grid gap-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select
                value={watch('clientId') || ''}
                onValueChange={(value) => setValue('clientId', value)}
              >
                <SelectTrigger className={errors.clientId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clientItems.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-destructive">{errors.clientId.message}</p>
              )}
            </div>

            {/* Date */}
            <div className="grid gap-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  {...register('startTime')}
                  className={errors.startTime ? 'border-destructive' : ''}
                />
                {errors.startTime && (
                  <p className="text-sm text-destructive">{errors.startTime.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  {...register('endTime')}
                  className={errors.endTime ? 'border-destructive' : ''}
                />
                {errors.endTime && (
                  <p className="text-sm text-destructive">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            {/* Session Type */}
            <div className="grid gap-2">
              <Label htmlFor="sessionTypeId">Session Type *</Label>
              <Select
                value={watch('sessionTypeId')}
                onValueChange={(value) => setValue('sessionTypeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a session type" />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypeItems.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sessionTypeId && (
                <p className="text-sm text-destructive">{errors.sessionTypeId.message}</p>
              )}
            </div>

            {/* Class Notes with Markdown */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>上课记录 / Class Notes (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFullscreenMode('notes')}
                  className="flex items-center gap-2"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  全屏编辑 Fullscreen
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                📝 Use Markdown to record class content, homework, and notes
              </p>
              <input type="hidden" {...register('notes')} />
              <MarkdownEditor
                value={watch('notes') || ''}
                onChange={(value) => {
                  setValue('notes', value, { 
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true 
                  });
                }}
                height={200}
                preview="live"
                placeholder="# 上课记录

## 本节内容
- 讨论主题 1
- 讨论主题 2

## 作业/任务
- [ ] 任务 1
- [ ] 任务 2

## 备注
其他补充说明..."
              />
            </div>

            {/* Info Message */}
            {!isEditMode && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium mb-1">💡 Note:</p>
                <p className="text-muted-foreground">
                  The system will automatically calculate the rate and total amount based on the
                  client&apos;s configured rates. Duration is calculated from start and end times.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Just close dialog, useEffect will handle reset
                onOpenChange(false);
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Recording...'
                : isEditMode
                  ? 'Update Session'
                  : 'Record Session'}
            </Button>
          </DialogFooter>

          {mutation.error && (
            <p className="mt-2 text-sm text-destructive">Error: {mutation.error.message}</p>
          )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}


