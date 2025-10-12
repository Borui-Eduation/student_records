'use client';

import { format } from 'date-fns';
import { Store, Calendar, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
// import type { Expense } from '@student-record/shared';

interface ExpenseCardProps {
  expense: any; // Expense & { id: string };
  onClick?: () => void;
  className?: string;
}

const paymentMethodLabels: Record<string, string> = {
  cash: '现金',
  credit_card: '信用卡',
  debit_card: '借记卡',
  alipay: '支付宝',
  wechat: '微信支付',
  other: '其他',
};

export function ExpenseCard({ expense, onClick, className }: ExpenseCardProps) {
  const date = expense.date instanceof Date 
    ? expense.date 
    : (expense.date as any)?.toDate?.() || new Date();

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-4 cursor-pointer',
        'hover:shadow-md hover:border-blue-300 transition-all',
        'active:scale-[0.98]', // 移动端点击反馈
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* 分类图标 */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: `${getCategoryColor(expense.category)}20` }}
        >
          {getCategoryIcon(expense.categoryName)}
        </div>

        {/* 主要信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {expense.description}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">{expense.categoryName}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-lg text-red-600">
                ¥{expense.amount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(date, 'yyyy-MM-dd')}</span>
            </div>
            {expense.merchant && (
              <div className="flex items-center gap-1">
                <Store className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{expense.merchant}</span>
              </div>
            )}
            {expense.paymentMethod && (
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span>{paymentMethodLabels[expense.paymentMethod] || expense.paymentMethod}</span>
              </div>
            )}
          </div>

          {/* 标签 */}
          {expense.tags && expense.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {expense.tags.slice(0, 3).map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
              {expense.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                  +{expense.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 缩略图 */}
        {expense.thumbnailUrl && (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ml-2">
            <img
              src={expense.thumbnailUrl}
              alt="Receipt"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// 辅助函数
function getCategoryIcon(categoryName?: string): string {
  // 这里可以根据分类名称返回对应的 emoji
  const iconMap: Record<string, string> = {
    '餐饮': '🍽️',
    '交通': '🚗',
    '汽车': '⛽',
    '住房': '🏠',
    '娱乐': '🎮',
    '购物': '🛍️',
    '医疗': '💊',
    '教育': '📚',
    '其他': '📋',
  };
  return iconMap[categoryName || ''] || '📋';
}

function getCategoryColor(_category?: string): string {
  // 默认颜色
  return '#BDB2FF';
}

