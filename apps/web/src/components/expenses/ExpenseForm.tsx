'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from './ImageUpload';
import { CategorySelector } from './CategorySelector';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Expense } from '@student-record/shared';

const formSchema = z.object({
  date: z.string().min(1, 'Please select a date'),
  amount: z.string().min(1, 'Please enter amount').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Amount must be greater than 0'),
  category: z.string().min(1, 'Please select a category'),
  categoryName: z.string().optional(),
  description: z.string().min(1, 'Please enter description').max(500, 'Description cannot exceed 500 characters'),
  merchant: z.string().max(200).optional(),
  paymentMethod: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().max(1000).optional(),
  imageData: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  initialData?: Partial<Expense>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function ExpenseForm({ initialData, onSubmit, onCancel, isSubmitting }: ExpenseFormProps) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData?.date 
        ? (initialData.date instanceof Date 
          ? initialData.date.toISOString().split('T')[0]
          : (initialData.date && typeof initialData.date === 'object' && 'toDate' in initialData.date && typeof initialData.date.toDate === 'function')
            ? initialData.date.toDate().toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0])
        : new Date().toISOString().split('T')[0],
      amount: initialData?.amount?.toString() || '',
      category: initialData?.category || '',
      categoryName: initialData?.categoryName || '',
      description: initialData?.description || '',
      merchant: initialData?.merchant || '',
      paymentMethod: initialData?.paymentMethod || '',
      tags: initialData?.tags?.join(', ') || '',
      notes: initialData?.notes || '',
    },
  });

  const category = watch('category');

  const handleFormSubmit = (data: FormData) => {
    // 转换数据格式
    const submitData = {
      date: data.date,
      amount: Number(data.amount),
      currency: 'CNY',
      category: data.category,
      description: data.description,
      merchant: data.merchant || undefined,
      paymentMethod: data.paymentMethod || undefined,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      notes: data.notes || undefined,
      imageData: imageData || undefined,
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Date and Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            {...register('date')}
            className={cn('mt-1', errors.date && 'border-red-500')}
          />
          {errors.date && (
            <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="amount">Amount (¥) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            {...register('amount')}
            className={cn('mt-1', errors.amount && 'border-red-500')}
          />
          {errors.amount && (
            <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
          )}
        </div>
      </div>

      {/* Category Selection */}
      <div>
        <Label>Category *</Label>
        <CategorySelector
          value={category}
          onChange={(id, name) => {
            setValue('category', id);
            setValue('categoryName', name);
          }}
          className="mt-1"
        />
        {errors.category && (
          <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description *</Label>
        <Input
          id="description"
          placeholder="e.g., Lunch, Gas, Rent"
          {...register('description')}
          className={cn('mt-1', errors.description && 'border-red-500')}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Merchant */}
      <div>
        <Label htmlFor="merchant">Merchant/Location</Label>
        <Input
          id="merchant"
          placeholder="e.g., McDonald's, Shell"
          {...register('merchant')}
          className="mt-1"
        />
      </div>

      {/* Payment Method */}
      <div>
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <select
          id="paymentMethod"
          {...register('paymentMethod')}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select payment method</option>
          <option value="cash">Cash</option>
          <option value="credit_card">Credit Card</option>
          <option value="debit_card">Debit Card</option>
          <option value="alipay">Alipay</option>
          <option value="wechat">WeChat Pay</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Tags */}
      <div>
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          placeholder="Comma-separated, e.g., work, reimbursement"
          {...register('tags')}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">Separate multiple tags with commas</p>
      </div>

      {/* Image Upload */}
      <div>
        <Label>Receipt/Invoice Image</Label>
        <ImageUpload
          value={initialData?.imageUrl}
          onChange={(base64) => setImageData(base64)}
          onError={(error) => setImageError(error)}
          className="mt-1"
        />
        {imageError && (
          <p className="mt-1 text-xs text-red-500">{imageError}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes..."
          rows={3}
          {...register('notes')}
          className="mt-1"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-4 border-t -mx-4 px-4 sm:mx-0 sm:px-0 sm:border-t-0 sm:pb-0">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial sm:min-w-[120px]"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

