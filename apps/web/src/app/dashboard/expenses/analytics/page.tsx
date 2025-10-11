'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, TrendingUp, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(subMonths(new Date(), 2)).toISOString().split('T')[0],
    end: endOfMonth(new Date()).toISOString().split('T')[0],
  });

  // 获取统计数据
  const { data: stats, isLoading } = trpc.expenses.getStatistics.useQuery({
    dateRange,
  });

  // 导出功能
  const { refetch: exportData } = trpc.expenseExport.export.useQuery(
    {
      format: 'csv',
      dateRange,
    },
    {
      enabled: false, // 手动触发
    }
  );

  const handleExport = async () => {
    const result = await exportData();
    if (result.data) {
      // 创建下载链接
      const blob = new Blob([result.data.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = result.data.filename;
      link.click();
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

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">暂无统计数据</p>
        <Button onClick={() => router.back()} className="mt-4">
          返回
        </Button>
      </div>
    );
  }

  // 计算最大月度金额（用于柱状图比例）
  const maxMonthlyAmount = Math.max(...stats.monthlyTrend.map(m => m.amount), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">统计分析</h1>
            <p className="text-sm text-muted-foreground mt-1">
              查看您的支出趋势和分类汇总
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          导出数据
        </Button>
      </div>

      {/* 日期范围选择 */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">开始日期</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">结束日期</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* 总览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">总支出</div>
          <div className="text-2xl font-bold text-red-600">
            ¥{stats.totalAmount.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">记录数</div>
          <div className="text-2xl font-bold">{stats.count}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">平均金额</div>
          <div className="text-2xl font-bold">
            ¥{stats.averageAmount.toFixed(0)}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">最大单笔</div>
          <div className="text-2xl font-bold">
            ¥{stats.maxAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 月度趋势 */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">月度支出趋势</h2>
        </div>
        {stats.monthlyTrend.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无数据</div>
        ) : (
          <div className="space-y-4">
            {/* 横向滚动容器（移动端） */}
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4 min-w-max sm:min-w-0 sm:grid sm:grid-cols-3 md:grid-cols-6">
                {stats.monthlyTrend.map((month) => {
                  const heightPercent = (month.amount / maxMonthlyAmount) * 100;
                  return (
                    <div key={month.month} className="flex flex-col items-center min-w-[80px]">
                      <div className="text-xs text-gray-600 mb-2">
                        {format(new Date(month.month), 'MM月')}
                      </div>
                      <div className="relative w-full h-32 bg-gray-100 rounded-t-lg overflow-hidden flex flex-col justify-end">
                        <div
                          className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <div className="text-xs font-semibold mt-2 text-center">
                        ¥{month.amount.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">{month.count}笔</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 分类占比 */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-6">
          <PieChart className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">分类支出占比</h2>
        </div>
        {stats.categoryBreakdown.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无数据</div>
        ) : (
          <div className="space-y-3">
            {stats.categoryBreakdown
              .sort((a, b) => b.amount - a.amount)
              .map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.categoryName}</span>
                      <span className="text-gray-500">{category.count}笔</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        ¥{category.amount.toFixed(2)}
                      </span>
                      <span className="text-gray-600 min-w-[3rem] text-right">
                        {category.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 支付方式统计 */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-6">支付方式统计</h2>
        {stats.paymentMethodBreakdown.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无数据</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {stats.paymentMethodBreakdown.map((method) => (
              <div key={method.paymentMethod} className="text-center p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">
                  {getPaymentMethodLabel(method.paymentMethod)}
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {method.percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ¥{method.amount.toFixed(0)}
                </div>
              </div>
            ))}
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



