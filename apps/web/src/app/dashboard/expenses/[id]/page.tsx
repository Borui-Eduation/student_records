'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { format } from 'date-fns';
import type { UpdateExpenseInput, CreateExpenseInput } from '@student-record/shared';

export default function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = params;
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const utils = trpc.useUtils();

  // 获取费用详情
  const queryResult = trpc.expenses.get.useQuery({ id: resolvedParams.id });
  const { data: expense, isLoading } = queryResult;
  
  // tRPC 类型推断问题的临时解决方案
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expenseData = expense as any;

  // 更新mutation
  const updateMutation = trpc.expenses.update.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh the list
      utils.expenses.list.invalidate();
      utils.expenses.getStatistics.invalidate();
      utils.expenses.get.invalidate({ id: resolvedParams.id });
      
      toast({
        title: '更新成功',
        description: '费用记录已更新',
      });
      setIsEditing(false);
      router.push('/dashboard/expenses');
    },
    onError: (error) => {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 删除mutation
  const deleteMutation = trpc.expenses.delete.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh the list
      utils.expenses.list.invalidate();
      utils.expenses.getStatistics.invalidate();
      
      toast({
        title: '删除成功',
        description: '费用记录已删除',
      });
      router.push('/dashboard/expenses');
    },
    onError: (error) => {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUpdate = (data: CreateExpenseInput | UpdateExpenseInput) => {
    updateMutation.mutate({
      ...data,
      id: resolvedParams.id,
    } as UpdateExpenseInput);
  };

  const handleDelete = () => {
    if (confirm('确定要删除这条费用记录吗？此操作不可恢复。')) {
      deleteMutation.mutate({ id: resolvedParams.id });
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

  if (!expense) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">费用记录不存在</p>
        <Button onClick={() => router.back()} className="mt-4">
          返回
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl sm:text-3xl font-bold">
              {isEditing ? '编辑费用' : '费用详情'}
            </h1>
          </div>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        {isEditing ? (
          <ExpenseForm
            initialData={expenseData}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isSubmitting={updateMutation.isPending}
          />
        ) : (
          <div className="space-y-6">
            {/* 图片 */}
            {expenseData?.imageUrl && (
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={expenseData.imageUrl}
                  alt="Receipt"
                  className="w-full h-auto max-h-96 object-contain bg-gray-50"
                />
              </div>
            )}

            {/* 基本信息 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">日期</div>
                <div className="font-medium">
                  {format(
                    expenseData.date instanceof Date 
                      ? expenseData.date 
                      : (expenseData.date && typeof expenseData.date === 'object' && 'toDate' in expenseData.date && typeof expenseData.date.toDate === 'function')
                        ? expenseData.date.toDate()
                        : new Date(),
                    'yyyy年MM月dd日'
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">金额</div>
                <div className="text-2xl font-bold text-red-600">
                  ¥{expenseData.amount.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">分类</div>
                <div className="font-medium">{expenseData.categoryName}</div>
              </div>
              {expenseData.paymentMethod && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">支付方式</div>
                  <div className="font-medium">
                    {getPaymentMethodLabel(expenseData.paymentMethod)}
                  </div>
                </div>
              )}
            </div>

            {/* 描述 */}
            <div>
              <div className="text-sm text-gray-600 mb-1">描述</div>
              <div className="font-medium">{expenseData.description}</div>
            </div>

            {/* 商家 */}
              {expenseData.merchant && (
              <div>
                <div className="text-sm text-gray-600 mb-1">商家/地点</div>
                  <div className="font-medium">{expenseData.merchant}</div>
              </div>
            )}

            {/* 标签 */}
            {expenseData.tags && expenseData.tags.length > 0 && (
              <div>
                <div className="text-sm text-gray-600 mb-2">标签</div>
                <div className="flex flex-wrap gap-2">
                  {expenseData.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 备注 */}
            {expenseData.notes && (
              <div>
                <div className="text-sm text-gray-600 mb-1">备注</div>
                <div className="text-gray-700 whitespace-pre-wrap">{expenseData.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: '现金',
    credit_card: '信用卡',
    debit_card: '借记卡',
    alipay: '支付宝',
    wechat: '微信支付',
    other: '其他',
  };
  return labels[method] || method;
}

