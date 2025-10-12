'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { ExpenseCard } from '@/components/expenses/ExpenseCard';
import { FloatingActionButton } from '@/components/expenses/FloatingActionButton';
import { SwipeActions } from '@/components/expenses/SwipeActions';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import type { Expense } from '@student-record/shared';

export default function ExpensesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [dateRange] = useState({
    start: startOfMonth(new Date()).toISOString(),
    end: endOfMonth(new Date()).toISOString(),
  });

  // 获取费用列表
  const { data: expensesData, isLoading, refetch } = trpc.expenses.list.useQuery({
    dateRange,
    sortBy: 'date',
    sortOrder: 'desc',
    limit: 50,
  });

  // 获取本月统计
  const { data: stats } = trpc.expenses.getStatistics.useQuery({
    dateRange,
  });

  // 删除mutation
  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Expense deleted',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const expenses = (expensesData?.items || []) as Expense[];

  // 按日期分组
  const groupedExpenses = expenses.reduce((acc: Record<string, Expense[]>, expense: Expense) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dateField = expense.date as any;
    const date = dateField instanceof Date
      ? dateField
      : (dateField && typeof dateField.toDate === 'function')
        ? dateField.toDate()
        : new Date();
    const dateStr = format(date, 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(expense);
    return acc;
  }, {});

  const handleExpenseClick = (id: string) => {
    router.push(`/dashboard/expenses/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 sm:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage your expenses
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/expenses/new')}
          className="hidden sm:flex"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600">This Month</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              ¥{stats.totalAmount.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600">Records</div>
            <div className="text-2xl font-bold mt-1">{stats.count}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600">Average</div>
            <div className="text-2xl font-bold mt-1">
              ¥{stats.averageAmount.toFixed(0)}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600">Max Amount</div>
            <div className="text-2xl font-bold mt-1">
              ¥{stats.maxAmount.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/expenses/analytics')}
        >
          <Filter className="h-4 w-4 mr-2" />
          Analytics
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/dashboard/expenses/categories')}
        >
          Categories
        </Button>
      </div>

      {/* 费用列表 */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No expenses yet
          </h3>
          <p className="text-gray-500 mb-6">
            Start recording your first expense
          </p>
          <Button onClick={() => router.push('/dashboard/expenses/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedExpenses).map(([dateStr, dayExpenses]: [string, Expense[]]) => {
            const date = new Date(dateStr);
            const total = dayExpenses.reduce((sum: number, exp: Expense) => sum + (exp.amount || 0), 0);

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date Header */}
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-semibold text-gray-900">
                    {format(date, 'MMM dd, EEEE')}
                  </h3>
                  <div className="text-sm text-gray-600">
                    Total ¥{total.toFixed(2)}
                  </div>
                </div>

                {/* 费用卡片 */}
                <div className="space-y-2">
                  {dayExpenses.map((expense: Expense) => (
                    isMobile ? (
                      <SwipeActions
                        key={expense.id}
                        onEdit={() => router.push(`/dashboard/expenses/${expense.id}`)}
                        onDelete={() => handleDelete(expense.id)}
                      >
                        <ExpenseCard
                          expense={expense}
                          onClick={() => handleExpenseClick(expense.id)}
                        />
                      </SwipeActions>
                    ) : (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        onClick={() => handleExpenseClick(expense.id)}
                      />
                    )
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 移动端浮动按钮 */}
      {isMobile && (
        <FloatingActionButton
          onClick={() => router.push('/dashboard/expenses/new')}
          label="Add Expense"
        />
      )}
    </div>
  );
}

