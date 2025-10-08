'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Calendar, Lock } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Clients',
      value: '0',
      description: 'Active clients',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Sessions',
      value: '0',
      description: 'This month',
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Invoices',
      value: '0',
      description: 'Pending',
      icon: FileText,
      color: 'text-orange-600',
    },
    {
      title: 'Knowledge Base',
      value: '0',
      description: 'Entries',
      icon: Lock,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Student Record Management System
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>No sessions recorded yet</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start by creating clients and recording sessions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">¥0</p>
            <p className="text-xs text-muted-foreground mt-1">
              No invoices generated yet
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

