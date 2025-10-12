'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateClientSchema, type CreateClientInput } from '@student-record/shared';
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

import type { Client, ClientType } from '@student-record/shared';

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null; // Existing client for edit mode
}

export function ClientDialog({ open, onOpenChange, client }: ClientDialogProps) {
  const utils = trpc.useUtils();
  const isEditMode = !!client;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateClientInput>({
    resolver: zodResolver(CreateClientSchema),
    defaultValues: {
      type: 'individual',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (client && open) {
      setValue('name', client.name);
      setValue('type', client.type);
      if (client.contactInfo) {
        setValue('contactInfo.email', client.contactInfo.email || '');
        setValue('contactInfo.phone', client.contactInfo.phone || '');
        setValue('contactInfo.address', client.contactInfo.address || '');
      }
      setValue('billingAddress', client.billingAddress || '');
      setValue('taxId', client.taxId || '');
      setValue('notes', client.notes || '');
    } else if (!open) {
      reset({
        type: 'individual',
      });
    }
  }, [client, open, setValue, reset]);

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      reset();
      onOpenChange(false);
    },
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      reset();
      onOpenChange(false);
    },
  });

  const onSubmit = async (data: CreateClientInput) => {
    if (isEditMode) {
      await updateMutation.mutateAsync({
        id: client.id,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const mutation = isEditMode ? updateMutation : createMutation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Client' : 'Create New Client'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update client information' : 'Add a new client to your system'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Client name"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as ClientType)}
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
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                {...register('contactInfo.email')}
              />
              {errors.contactInfo?.email && (
                <p className="text-sm text-destructive">
                  {errors.contactInfo.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+86 138 0000 0000"
                {...register('contactInfo.phone')}
              />
              {errors.contactInfo?.phone && (
                <p className="text-sm text-destructive">
                  {errors.contactInfo.phone.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Full address"
                {...register('contactInfo.address')}
              />
            </div>

            {/* Billing Address */}
            <div className="grid gap-2">
              <Label htmlFor="billingAddress">Billing Address</Label>
              <Textarea
                id="billingAddress"
                placeholder="Billing address (if different)"
                {...register('billingAddress')}
              />
            </div>

            {/* Tax ID */}
            <div className="grid gap-2">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                placeholder="Tax identification number"
                {...register('taxId')}
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes"
                {...register('notes')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
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
                  : 'Creating...'
                : isEditMode
                  ? 'Update Client'
                  : 'Create Client'}
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


