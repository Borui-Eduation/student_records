'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

interface RevenueTrendChartProps {
  monthlyRevenue: MonthlyData[];
  monthlyExpenses: { month: string; amount: number }[];
  isLoading?: boolean;
  onRangeChange?: (range: 'day' | 'week' | 'month') => void;
}

export function RevenueTrendChart({ monthlyRevenue, monthlyExpenses, isLoading, onRangeChange }: RevenueTrendChartProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('month');

  // Handle range change
  const handleRangeChange = (value: string) => {
    const newRange = value as 'day' | 'week' | 'month';
    setTimeRange(newRange);
    onRangeChange?.(newRange);
  };

  // Merge revenue and expense data
  const chartData = prepareTrendData(monthlyRevenue, monthlyExpenses);

  // Calculate statistics
  const stats = calculateStats(chartData);

  // Get label info based on time range
  const rangeInfo = {
    day: { label: 'Last 30 days', count: 30 },
    week: { label: 'Last 12 weeks', count: 12 },
    month: { label: 'Last 6 months', count: 6 },
  }[timeRange];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            Revenue vs Expenses Trend
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading chart...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            Revenue vs Expenses Trend
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">No data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Revenue vs Expenses Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              {rangeInfo.label} • Net: ¥{stats.netTotal.toLocaleString()}
            </CardDescription>
          </div>
          <Tabs value={timeRange} onValueChange={handleRangeChange} className="w-full sm:w-auto">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="day" className="text-xs sm:text-sm">Daily</TabsTrigger>
              <TabsTrigger value="week" className="text-xs sm:text-sm">Weekly</TabsTrigger>
              <TabsTrigger value="month" className="text-xs sm:text-sm">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600">Avg Revenue</p>
            <p className="text-base sm:text-lg font-bold text-green-600">
              ¥{stats.avgRevenue.toFixed(0)}
            </p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-600">Avg Expenses</p>
            <p className="text-base sm:text-lg font-bold text-red-600">
              ¥{stats.avgExpenses.toFixed(0)}
            </p>
          </div>
          <div className={`text-center p-3 rounded-lg ${stats.netTotal >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <p className="text-xs text-gray-600">Trend</p>
            <div className="flex items-center justify-center gap-1">
              {stats.trend >= 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <p className="text-base sm:text-lg font-bold text-blue-600">
                    +{stats.trend.toFixed(0)}%
                  </p>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-orange-600" />
                  <p className="text-base sm:text-lg font-bold text-orange-600">
                    {stats.trend.toFixed(0)}%
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => {
                  if (timeRange === 'day') {
                    // Assume value is like "2024-10-12"
                    const date = new Date(value);
                    return format(date, 'MMM d');
                  } else if (timeRange === 'week') {
                    // Assume value is like "2024-W42"
                    return value.split('-W')[1] ? `W${value.split('-W')[1]}` : value;
                  } else {
                    // month: value is like "2024-10"
                    const date = new Date(value + '-01');
                    return format(date, 'MMM');
                  }
                }}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                labelFormatter={(label) => {
                  if (timeRange === 'day') {
                    const date = new Date(label);
                    return format(date, 'MMMM d, yyyy');
                  } else if (timeRange === 'week') {
                    return label.split('-W')[1] ? `Week ${label.split('-W')[1]} of ${label.split('-W')[0]}` : label;
                  } else {
                    const date = new Date(label + '-01');
                    return format(date, 'MMMM yyyy');
                  }
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#colorExpenses)"
                name="Expenses"
              />
              <Area
                type="monotone"
                dataKey="net"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorNet)"
                name="Net Income"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Month over Month Comparison */}
        {chartData.length >= 2 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Month-over-Month Change</h4>
            <div className="space-y-2">
              {getMoMComparison(chartData).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Revenue:</span>
                    <span className={item.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {item.revenueChange >= 0 ? '+' : ''}{item.revenueChange.toFixed(1)}%
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">Expenses:</span>
                    <span className={item.expenseChange >= 0 ? 'text-red-600' : 'text-green-600'}>
                      {item.expenseChange >= 0 ? '+' : ''}{item.expenseChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function prepareTrendData(
  monthlyRevenue: MonthlyData[],
  monthlyExpenses: { month: string; amount: number }[]
) {
  // Create a map of all unique months
  const monthsMap = new Map<string, { revenue: number; expenses: number }>();

  // Add revenue data
  monthlyRevenue.forEach((item) => {
    monthsMap.set(item.month, {
      revenue: item.revenue,
      expenses: 0,
    });
  });

  // Add expense data
  monthlyExpenses.forEach((item) => {
    const existing = monthsMap.get(item.month);
    if (existing) {
      existing.expenses = item.amount;
    } else {
      monthsMap.set(item.month, {
        revenue: 0,
        expenses: item.amount,
      });
    }
  });

  // Convert to array and sort by month
  const sortedData = Array.from(monthsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      date: month,
      revenue: data.revenue,
      expenses: data.expenses,
      net: data.revenue - data.expenses,
    }));

  return sortedData;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  expenses: number;
  net: number;
}

function calculateStats(data: ChartDataPoint[]) {
  if (data.length === 0) {
    return {
      avgRevenue: 0,
      avgExpenses: 0,
      netTotal: 0,
      trend: 0,
    };
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);

  // Calculate trend (comparing first half vs second half)
  const midPoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midPoint);
  const secondHalf = data.slice(midPoint);

  const firstHalfAvg =
    firstHalf.reduce((sum, item) => sum + item.net, 0) / (firstHalf.length || 1);
  const secondHalfAvg =
    secondHalf.reduce((sum, item) => sum + item.net, 0) / (secondHalf.length || 1);

  const trend = firstHalfAvg !== 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

  return {
    avgRevenue: totalRevenue / data.length,
    avgExpenses: totalExpenses / data.length,
    netTotal: totalRevenue - totalExpenses,
    trend,
  };
}

function getMoMComparison(data: ChartDataPoint[]) {
  const comparisons = [];
  for (let i = 1; i < Math.min(data.length, 4); i++) {
    const current = data[data.length - i];
    const previous = data[data.length - i - 1];

    const revenueChange =
      previous.revenue !== 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0;
    const expenseChange =
      previous.expenses !== 0
        ? ((current.expenses - previous.expenses) / previous.expenses) * 100
        : 0;

    comparisons.push({
      month: format(new Date(current.date + '-01'), 'MMM'),
      revenueChange,
      expenseChange,
    });
  }
  return comparisons.reverse();
}

