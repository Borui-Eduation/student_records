'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateRateSchema, type CreateRateInput } from '@student-record/shared';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';

interface RateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate?: any; // Existing rate for edit mode
}

export function RateDialog({ open, onOpenChange, rate }: RateDialogProps) {
  const utils = trpc.useUtils();
  const isEditMode = !!rate;

  // Get clients list for dropdown
  const { data: clients } = trpc.clients.list.useQuery({
    active: true,
    limit: 100,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateRateInput>({
    resolver: zodResolver(CreateRateSchema),
    defaultValues: {
      currency: 'CNY',
      effectiveDate: new Date().toISOString().split('T')[0],
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (rate && open) {
      setValue('amount', rate.amount);
      setValue('currency', rate.currency || 'CNY');
      setValue('clientId', rate.clientId || undefined);
      setValue('clientType', rate.clientType || undefined);
      
      // Convert Firestore Timestamp to date string
      if (rate.effectiveDate) {
        const effectiveDate = rate.effectiveDate.toDate
          ? rate.effectiveDate.toDate()
          : new Date(rate.effectiveDate);
        setValue('effectiveDate', effectiveDate.toISOString().split('T')[0]);
      }
      
      if (rate.endDate) {
        const endDate = rate.endDate.toDate ? rate.endDate.toDate() : new Date(rate.endDate);
        setValue('endDate', endDate.toISOString().split('T')[0]);
      }
      
      setValue('description', rate.description || '');
    } else if (!open) {
      reset({
        currency: 'CNY',
        effectiveDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [rate, open, setValue, reset]);

  const createMutation = trpc.rates.create.useMutation({
    onSuccess: () => {
      utils.rates.list.invalidate();
      utils.clients.list.invalidate(); // Also invalidate clients (for updated defaultRateIds)
      reset();
      onOpenChange(false);
    },
  });

  const updateMutation = trpc.rates.update.useMutation({
    onSuccess: () => {
      utils.rates.list.invalidate();
      utils.clients.list.invalidate();
      reset();
      onOpenChange(false);
    },
  });

  const onSubmit = async (data: CreateRateInput) => {
    if (isEditMode) {
      await updateMutation.mutateAsync({
        id: rate.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const mutation = isEditMode ? updateMutation : createMutation;

  const assignmentType = watch('clientId') ? 'specific' : watch('clientType') ? 'type' : 'none';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Rate' : 'Create New Rate'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the hourly rate information'
                : 'Set an hourly rate for a specific client, client type, or as a general rate'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">Hourly Rate (¥) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="500.00"
                {...register('amount', { valueAsNumber: true })}
                className={errors.amount ? 'border-destructive' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>

            {/* Assignment Type Selector */}
            <div className="grid gap-2">
              <Label>Assign to</Label>
              <Select
                value={assignmentType}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setValue('clientId', undefined);
                    setValue('clientType', undefined);
                  } else if (value === 'specific') {
                    setValue('clientType', undefined);
                  } else if (value === 'type') {
                    setValue('clientId', undefined);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="specific">Specific Client</SelectItem>
                  <SelectItem value="type">Client Type</SelectItem>
                  <SelectItem value="none">General Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific Client Selection */}
            {assignmentType === 'specific' && (
              <div className="grid gap-2">
                <Label htmlFor="clientId">Client *</Label>
                <Select
                  value={watch('clientId') || ''}
                  onValueChange={(value) => setValue('clientId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.items.map((client: any) => (
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
            )}

            {/* Client Type Selection */}
            {assignmentType === 'type' && (
              <div className="grid gap-2">
                <Label htmlFor="clientType">Client Type *</Label>
                <Select
                  value={watch('clientType') || ''}
                  onValueChange={(value) => setValue('clientType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="institution">Institution</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
                {errors.clientType && (
                  <p className="text-sm text-destructive">{errors.clientType.message}</p>
                )}
              </div>
            )}

            {/* Effective Date */}
            <div className="grid gap-2">
              <Label htmlFor="effectiveDate">Effective Date *</Label>
              <Input
                id="effectiveDate"
                type="date"
                {...register('effectiveDate')}
                className={errors.effectiveDate ? 'border-destructive' : ''}
              />
              {errors.effectiveDate && (
                <p className="text-sm text-destructive">{errors.effectiveDate.message}</p>
              )}
            </div>

            {/* End Date (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              <p className="text-xs text-muted-foreground">
                Leave blank if this rate has no end date
              </p>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="E.g., Standard tutoring rate, Technical consulting..."
                {...register('description')}
                rows={2}
              />
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
                  ? 'Update Rate'
                  : 'Create Rate'}
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


