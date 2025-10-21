'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';
import type { CreateExpenseInput } from '@professional-workspace/shared';

export default function NewExpensePage() {
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const createMutation = trpc.expenses.create.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh the list
      utils.expenses.list.invalidate();
      utils.expenses.getStatistics.invalidate();
      
      toast({
        title: 'Success',
        description: 'Expense record saved',
      });
      router.push('/dashboard/expenses');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });


  const handleSubmit = (data: CreateExpenseInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Add Expense</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record a new expense
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <ExpenseForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}

