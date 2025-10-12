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
  dateRange?: { start: Date; end: Date };
}

export function RevenueTrendChart({ monthlyRevenue, monthlyExpenses, isLoading, onRangeChange, dateRange }: RevenueTrendChartProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('month');

  // Handle range change
  const handleRangeChange = (value: string) => {
    const newRange = value as 'day' | 'week' | 'month';
    setTimeRange(newRange);
    onRangeChange?.(newRange);
  };

  // Merge revenue and expense data with date range filling
  const chartData = prepareTrendData(monthlyRevenue, monthlyExpenses, timeRange, dateRange);

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
                  try {
                    if (timeRange === 'day') {
                      // value is like "2025-10-12" (UTC)
                      const [year, month, day] = value.split('-').map(Number);
                      const date = new Date(Date.UTC(year, month - 1, day));
                      if (isNaN(date.getTime())) {
                        return value;
                      }
                      return format(date, 'MMM d');
                    } else if (timeRange === 'week') {
                      // value is like "2025-W42"
                      return value.split('-W')[1] ? `W${value.split('-W')[1]}` : value;
                    } else {
                      // month: value is like "2025-10" (UTC)
                      const [year, month] = value.split('-').map(Number);
                      const date = new Date(Date.UTC(year, month - 1, 1));
                      if (isNaN(date.getTime())) {
                        return value;
                      }
                      return format(date, 'MMM');
                    }
                  } catch {
                    return value;
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
                  try {
                    if (timeRange === 'day') {
                      // label is like "2025-10-12" (UTC)
                      const [year, month, day] = label.split('-').map(Number);
                      const date = new Date(Date.UTC(year, month - 1, day));
                      if (isNaN(date.getTime())) {
                        return label;
                      }
                      return format(date, 'MMMM d, yyyy');
                    } else if (timeRange === 'week') {
                      // label is like "2025-W42"
                      return label.split('-W')[1] ? `Week ${label.split('-W')[1]} of ${label.split('-W')[0]}` : label;
                    } else {
                      // month: label is like "2025-10" (UTC)
                      const [year, month] = label.split('-').map(Number);
                      const date = new Date(Date.UTC(year, month - 1, 1));
                      if (isNaN(date.getTime())) {
                        return label;
                      }
                      return format(date, 'MMMM yyyy');
                    }
                  } catch {
                    return label;
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
  monthlyExpenses: { month: string; amount: number }[],
  timeRange: 'day' | 'week' | 'month',
  dateRange?: { start: Date; end: Date }
) {
  // Create a map of all data
  const dataMap = new Map<string, { revenue: number; expenses: number }>();

  // Add revenue data
  monthlyRevenue.forEach((item) => {
    dataMap.set(item.month, {
      revenue: item.revenue,
      expenses: 0,
    });
  });

  // Add expense data
  monthlyExpenses.forEach((item) => {
    const existing = dataMap.get(item.month);
    if (existing) {
      existing.expenses = item.amount;
    } else {
      dataMap.set(item.month, {
        revenue: 0,
        expenses: item.amount,
      });
    }
  });

  // Generate complete date range
  const completeRange = generateDateRange(timeRange, dateRange);
  
  // Fill in missing dates with zero values
  const sortedData = completeRange.map(dateKey => {
    const data = dataMap.get(dateKey) || { revenue: 0, expenses: 0 };
    return {
      date: dateKey,
      revenue: data.revenue,
      expenses: data.expenses,
      net: data.revenue - data.expenses,
    };
  });

  return sortedData;
}

// Generate complete date range based on granularity
// Converts to UTC to match backend processing
function generateDateRange(
  timeRange: 'day' | 'week' | 'month',
  dateRange?: { start: Date; end: Date }
): string[] {
  if (!dateRange) {
    return [];
  }

  const result: string[] = [];
  
  // Convert local dates to UTC midnight to match backend
  const startUTC = new Date(Date.UTC(
    dateRange.start.getFullYear(),
    dateRange.start.getMonth(),
    dateRange.start.getDate()
  ));
  const endUTC = new Date(Date.UTC(
    dateRange.end.getFullYear(),
    dateRange.end.getMonth(),
    dateRange.end.getDate()
  ));
  
  const current = new Date(startUTC.getTime());

  while (current <= endUTC) {
    const year = current.getUTCFullYear();
    const month = String(current.getUTCMonth() + 1).padStart(2, '0');
    const day = String(current.getUTCDate()).padStart(2, '0');

    switch (timeRange) {
      case 'day':
        result.push(`${year}-${month}-${day}`);
        current.setUTCDate(current.getUTCDate() + 1);
        break;
      case 'week': {
        // Get ISO week number using UTC
        const onejan = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil(((current.getTime() - onejan.getTime()) / 86400000 + onejan.getUTCDay() + 1) / 7);
        const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;
        if (!result.includes(weekKey)) {
          result.push(weekKey);
        }
        current.setUTCDate(current.getUTCDate() + 7);
        break;
      }
      case 'month':
        result.push(`${year}-${month}`);
        current.setUTCMonth(current.getUTCMonth() + 1);
        break;
    }
  }

  return result;
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

    let monthLabel = current.date;
    try {
      // current.date is like "2025-10" (UTC)
      const [year, month] = current.date.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, 1));
      if (!isNaN(date.getTime())) {
        monthLabel = format(date, 'MMM');
      }
    } catch {
      // Keep original date string if formatting fails
    }

    comparisons.push({
      month: monthLabel,
      revenueChange,
      expenseChange,
    });
  }
  return comparisons.reverse();
}

