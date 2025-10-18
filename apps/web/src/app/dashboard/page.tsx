'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Calendar, TrendingUp, DollarSign, TrendingDown, Receipt } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { format, startOfMonth, endOfMonth, subDays, subWeeks } from 'date-fns';
import Link from 'next/link';
import { RevenueTrendChart } from '@/components/dashboard/RevenueTrendChart';
import { toDate } from '@/lib/utils';
import type { Invoice, Expense, ClientRevenueData, CategoryBreakdownData } from '@/types';

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('month');

  // Calculate date range based on time range selection - memoize to prevent unnecessary re-renders
  const dateRange = useMemo(() => {
    const now = new Date();
    
    let result;
    switch (timeRange) {
      case 'day':
        result = {
          start: subDays(now, 29), // Last 30 days
          end: now,
        };
        break;
      case 'week':
        result = {
          start: subWeeks(now, 11), // Last 12 weeks
          end: now,
        };
        break;
      case 'month':
      default: {
        // Use middle of the day to avoid timezone edge cases
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // Start: first day of 5 months ago at noon (to show last 6 months including current)
        const startMonth = new Date(currentYear, currentMonth - 5, 1, 12, 0, 0);
        
        // End: use current date to ensure current month is included
        result = {
          start: startMonth,
          end: now,
        };
        break;
      }
    }
    
    console.log('Dashboard dateRange:', {
      timeRange,
      start: result.start.toISOString(),
      end: result.end.toISOString(),
      startLocal: result.start.toString(),
      endLocal: result.end.toString(),
    });
    
    return result;
  }, [timeRange]);

  // Get current month date range for stats
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  // Fetch data
  const { data: clients } = trpc.clients.list.useQuery({ active: true, limit: 100 });
  const { data: sessions } = trpc.sessions.list.useQuery({
    dateRange: {
      start: currentMonthStart.toISOString(),
      end: currentMonthEnd.toISOString(),
    },
    limit: 100,
  });
  const { data: invoices } = trpc.invoices.list.useQuery({ limit: 100 });
  const { data: revenue } = trpc.invoices.getRevenueReport.useQuery({
    dateRange: {
      start: currentMonthStart.toISOString(),
      end: currentMonthEnd.toISOString(),
    },
  });

  // Fetch expense data
  const { data: expenseStats } = trpc.expenses.getStatistics.useQuery({
    dateRange: {
      start: currentMonthStart.toISOString(),
      end: currentMonthEnd.toISOString(),
    },
  });

  const { data: recentExpenses } = trpc.expenses.list.useQuery({
    limit: 5,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const typedInvoices = (invoices?.items || []) as Invoice[];
  const typedRecentExpenses = (recentExpenses?.items || []) as Expense[];

  // Fetch trend data based on selected time range
  const { data: trendRevenue, isLoading: revenueLoading } = trpc.invoices.getMonthlyRevenue.useQuery({
    dateRange: {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    },
    granularity: timeRange,
  });

  const { data: trendExpenses, isLoading: expensesLoading } = trpc.expenses.getStatistics.useQuery({
    dateRange: {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
    },
    granularity: timeRange,
  });

  // Calculate net income
  const totalRevenue = revenue?.totalRevenue || 0;
  const totalExpenses = expenseStats?.totalAmount || 0;
  const netIncome = totalRevenue - totalExpenses;

  const stats = [
    {
      title: 'Total Revenue',
      value: `¥${totalRevenue.toLocaleString()}`,
      description: 'This month',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/dashboard/sessions',
    },
    {
      title: 'Total Expenses',
      value: `¥${totalExpenses.toLocaleString()}`,
      description: 'This month',
      icon: Receipt,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      href: '/dashboard/expenses',
    },
    {
      title: 'Net Income',
      value: `¥${netIncome.toLocaleString()}`,
      description: netIncome >= 0 ? 'Profit' : 'Loss',
      icon: netIncome >= 0 ? TrendingUp : TrendingDown,
      color: netIncome >= 0 ? 'text-blue-600' : 'text-orange-600',
      bgColor: netIncome >= 0 ? 'bg-blue-50' : 'bg-orange-50',
      href: '/dashboard',
    },
    {
      title: 'Active Clients',
      value: clients?.items.length || 0,
      description: 'Total clients',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/dashboard/clients',
    },
    {
      title: 'Sessions',
      value: sessions?.items.length || 0,
      description: 'This month',
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '/dashboard/sessions',
    },
    {
      title: 'Pending Invoices',
      value: typedInvoices.filter((i: Invoice) => i.status !== 'paid').length || 0,
      description: 'Awaiting payment',
      icon: FileText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      href: '/dashboard/invoices',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome to your Business Management System
        </p>
      </div>

      {/* Stats Cards - 6 cards in grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Revenue vs Expenses Trend - Enhanced Chart */}
      <RevenueTrendChart
        monthlyRevenue={(trendRevenue?.monthlyData || []).map(item => ({ ...item, expenses: 0 }))}
        monthlyExpenses={trendExpenses?.monthlyTrend || []}
        isLoading={revenueLoading || expensesLoading}
        onRangeChange={setTimeRange}
        dateRange={dateRange}
      />

      {/* Recent Activities */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Expenses</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Last 5 expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {recentExpenses && recentExpenses.items.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {typedRecentExpenses.slice(0, 5).map((expense: Expense) => {
                  return (
                    <Link
                      key={expense.id}
                      href="/dashboard/expenses"
                      className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{expense.description || 'Expense'}</p>
                        <p className="text-xs text-muted-foreground">
                          {expense.date ? format(toDate(expense.date), 'MMM d, yyyy') : 'N/A'} • {expense.categoryName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-red-600">
                          -¥{expense.amount?.toLocaleString()}
                        </p>
                        {expense.merchant && (
                          <p className="text-xs text-muted-foreground">{expense.merchant}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No expenses recorded yet</p>
                <Link href="/dashboard/expenses">
                  <span className="text-sm text-primary hover:underline mt-2 inline-block">
                    Add your first expense →
                  </span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Top Clients & Expense Categories */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Top Clients by Revenue */}
        {revenue && revenue.byClient && revenue.byClient.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Top Clients by Revenue</CardTitle>
              <CardDescription className="text-xs sm:text-sm">This month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {revenue.byClient
                  .sort((a: ClientRevenueData, b: ClientRevenueData) => b.revenue - a.revenue)
                  .slice(0, 5)
                  .map((client: ClientRevenueData) => (
                    <div key={client.clientId} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{client.clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.sessionCount} session(s), {client.hours.toFixed(1)} hours
                          </p>
                        </div>
                        <p className="text-base font-bold text-green-600">¥{client.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expense Category Breakdown */}
        {expenseStats && expenseStats.categoryBreakdown && expenseStats.categoryBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Expense Categories</CardTitle>
              <CardDescription className="text-xs sm:text-sm">This month breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenseStats.categoryBreakdown
                  .sort((a: CategoryBreakdownData, b: CategoryBreakdownData) => b.amount - a.amount)
                  .slice(0, 5)
                  .map((category: CategoryBreakdownData) => (
                    <div key={category.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{category.categoryName}</span>
                          <span className="text-xs text-muted-foreground">{category.count} items</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-600">
                            ¥{category.amount.toFixed(0)}
                          </span>
                          <span className="text-xs text-muted-foreground min-w-[2.5rem] text-right">
                            {category.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-400 to-red-500 h-full rounded-full transition-all"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

