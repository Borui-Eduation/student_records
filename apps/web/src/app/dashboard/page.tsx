'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Calendar, Lock, TrendingUp, DollarSign } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { format, subDays } from 'date-fns';
import Link from 'next/link';

export default function DashboardPage() {
  // Get current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Fetch data
  const { data: clients } = trpc.clients.list.useQuery({ active: true, limit: 100 });
  const { data: sessions } = trpc.sessions.list.useQuery({
    dateRange: {
      start: startOfMonth.toISOString(),
      end: endOfMonth.toISOString(),
    },
    limit: 100,
  });
  const { data: invoices } = trpc.invoices.list.useQuery({ limit: 100 });
  const { data: knowledge } = trpc.knowledgeBase.list.useQuery({ limit: 100 });
  const { data: recentSessions } = trpc.sessions.list.useQuery({ limit: 5 });
  const { data: revenue } = trpc.invoices.getRevenueReport.useQuery({
    dateRange: {
      start: startOfMonth.toISOString(),
      end: endOfMonth.toISOString(),
    },
  });

  const stats = [
    {
      title: 'Total Clients',
      value: clients?.items.length || 0,
      description: 'Active clients',
      icon: Users,
      color: 'text-blue-600',
      href: '/dashboard/clients',
    },
    {
      title: 'Sessions',
      value: sessions?.items.length || 0,
      description: 'This month',
      icon: Calendar,
      color: 'text-green-600',
      href: '/dashboard/sessions',
    },
    {
      title: 'Invoices',
      value: invoices?.items.filter((i: any) => i.status !== 'paid').length || 0,
      description: 'Pending payment',
      icon: FileText,
      color: 'text-orange-600',
      href: '/dashboard/invoices',
    },
    {
      title: 'Knowledge Base',
      value: knowledge?.items.length || 0,
      description: 'Entries',
      icon: Lock,
      color: 'text-purple-600',
      href: '/dashboard/knowledge',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome to Student Record Management System
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Revenue & Recent Sessions */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
        {/* Revenue Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              Revenue Overview
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">This month</CardDescription>
          </CardHeader>
          <CardContent>
            {revenue ? (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold">¥{revenue.totalRevenue?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {revenue.sessionCount || 0} sessions, {revenue.totalHours?.toFixed(1) || 0} hours
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Unbilled</p>
                    <p className="font-semibold text-yellow-600">
                      ¥{revenue.unbilledRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Billed</p>
                    <p className="font-semibold text-blue-600">
                      ¥{revenue.billedRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Paid</p>
                    <p className="font-semibold text-green-600">
                      ¥{revenue.paidRevenue?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
                {revenue.averageRate > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">
                      Average rate: ¥{revenue.averageRate?.toFixed(0)}/hour
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-2xl font-bold">¥0</p>
                <p className="text-xs text-muted-foreground mt-1">No sessions recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Sessions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Last 5 sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions && recentSessions.items.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {recentSessions.items.slice(0, 5).map((session: any) => (
                  <Link
                    key={session.id}
                    href="/dashboard/sessions"
                    className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{session.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.date?.toDate
                          ? format(session.date.toDate(), 'MMM d, yyyy')
                          : 'N/A'}{' '}
                        • {session.durationHours}h
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        ¥{session.totalAmount?.toLocaleString()}
                      </p>
                      <p
                        className={`text-xs ${
                          session.billingStatus === 'paid'
                            ? 'text-green-600'
                            : session.billingStatus === 'billed'
                            ? 'text-blue-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {session.billingStatus}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No sessions recorded yet</p>
                <Link href="/dashboard/sessions">
                  <span className="text-sm text-primary hover:underline mt-2 inline-block">
                    Record your first session →
                  </span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients by Revenue */}
      {revenue && revenue.byClient && revenue.byClient.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Top Clients by Revenue</CardTitle>
            <CardDescription className="text-xs sm:text-sm">This month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 sm:space-y-3">
              {revenue.byClient
                .sort((a: any, b: any) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((client: any) => (
                  <div key={client.clientId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{client.clientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.sessionCount} session(s), {client.hours.toFixed(1)} hours
                      </p>
                    </div>
                    <p className="text-lg font-bold">¥{client.revenue.toLocaleString()}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

