'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateSessionTypeSchema, type CreateSessionTypeInput, type SessionType } from '@student-record/shared';
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
import { trpc } from '@/lib/trpc';

interface SessionTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionType?: SessionType | null;
}

export function SessionTypeDialog({
  open,
  onOpenChange,
  sessionType,
}: SessionTypeDialogProps) {
  const utils = trpc.useUtils();
  const isEditMode = !!sessionType;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<CreateSessionTypeInput>({
    resolver: zodResolver(CreateSessionTypeSchema),
  });

  useEffect(() => {
    if (sessionType && open) {
      setValue('name', sessionType.name);
    } else if (!open) {
      reset();
    }
  }, [sessionType, open, setValue, reset]);

  const createMutation = trpc.sessionTypes.create.useMutation({
    onSuccess: () => {
      utils.sessionTypes.list.invalidate();
      reset();
      onOpenChange(false);
    },
  });

  const updateMutation = trpc.sessionTypes.update.useMutation({
    onSuccess: () => {
      utils.sessionTypes.list.invalidate();
      reset();
      onOpenChange(false);
    },
  });

  const onSubmit = async (data: CreateSessionTypeInput) => {
    if (isEditMode) {
      await updateMutation.mutateAsync({
        id: sessionType.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const mutation = isEditMode ? updateMutation : createMutation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Session Type' : 'Create New Session Type'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the session type information'
                : 'Create a new custom session type category'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Teaching, Consulting, Code Review"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>

          {mutation.error && (
            <p className="mt-2 text-sm text-destructive">Error: {mutation.error.message}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}


