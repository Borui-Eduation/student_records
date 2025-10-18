'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateClientTypeSchema, type CreateClientTypeInput } from '@student-record/shared';
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

interface ClientTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientType?: any | null;
}

export function ClientTypeDialog({
  open,
  onOpenChange,
  clientType,
}: ClientTypeDialogProps) {
  const utils = trpc.useUtils();
  const isEditMode = !!clientType;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = useForm<CreateClientTypeInput>({
    resolver: zodResolver(CreateClientTypeSchema),
  });

  useEffect(() => {
    if (clientType && open) {
      setValue('name', clientType.name);
      setValue('color', clientType.color || '');
    } else if (!open) {
      reset();
    }
  }, [clientType, open, setValue, reset]);

  const createMutation = trpc.clientTypes.create.useMutation({
    onSuccess: () => {
      utils.clientTypes.list.invalidate();
      reset();
      onOpenChange(false);
    },
  });

  const updateMutation = trpc.clientTypes.update.useMutation({
    onSuccess: () => {
      utils.clientTypes.list.invalidate();
      reset();
      onOpenChange(false);
    },
  });

  const onSubmit = async (data: CreateClientTypeInput) => {
    if (isEditMode) {
      await updateMutation.mutateAsync({
        id: clientType.id,
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
              {isEditMode ? 'Edit Client Type' : 'Create New Client Type'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the client type information'
                : 'Create a new custom client type category'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Enterprise, Student, Freelancer"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Color */}
            <div className="grid gap-2">
              <Label htmlFor="color">Color (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  {...register('color')}
                  className="w-16 h-10"
                />
                <Input
                  placeholder="#FF5733"
                  {...register('color')}
                  className={errors.color ? 'border-destructive' : ''}
                />
              </div>
              {errors.color && (
                <p className="text-sm text-destructive">{errors.color.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Hex color code for UI display (optional)
              </p>
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

