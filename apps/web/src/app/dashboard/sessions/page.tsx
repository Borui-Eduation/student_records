'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Clock, DollarSign } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { SessionDialog } from '@/components/sessions/SessionDialog';
import { format } from 'date-fns';

export default function SessionsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Query sessions
  const { data, isLoading, error } = trpc.sessions.list.useQuery({
    limit: 50,
  });

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case 'unbilled':
        return 'text-yellow-600 bg-yellow-50';
      case 'billed':
        return 'text-blue-600 bg-blue-50';
      case 'paid':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSessionTypeColor = (type: string) => {
    return type === 'education'
      ? 'text-purple-600 bg-purple-50'
      : 'text-orange-600 bg-orange-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">Track and manage your teaching sessions</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      <SessionDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading sessions: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="grid gap-4">
          {data.items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No sessions recorded yet</p>
                <Button variant="link" onClick={() => setIsCreateDialogOpen(true)} className="mt-2">
                  Record your first session
                </Button>
              </CardContent>
            </Card>
          ) : (
            data.items.map((session: any) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{session.clientName}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {session.date?.toDate
                            ? format(session.date.toDate(), 'yyyy-MM-dd')
                            : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {session.startTime} - {session.endTime}
                          <span className="text-xs ml-1">
                            ({session.durationHours}h)
                          </span>
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-2xl font-bold">
                        ¥{session.totalAmount?.toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getSessionTypeColor(
                            session.sessionType
                          )}`}
                        >
                          {session.sessionType === 'education' ? 'Education' : 'Technical'}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getBillingStatusColor(
                            session.billingStatus
                          )}`}
                        >
                          {session.billingStatus.charAt(0).toUpperCase() +
                            session.billingStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Hourly Rate:</span>
                      <span className="ml-2 font-medium">¥{session.rateAmount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="ml-2 font-medium">{session.currency}</span>
                    </div>
                  </div>
                  {session.contentBlocks && session.contentBlocks.length > 0 && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      📝 {session.contentBlocks.length} content block(s)
                    </div>
                  )}
                  {session.audioUrls && session.audioUrls.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      🎤 {session.audioUrls.length} audio recording(s)
                    </div>
                  )}
                  {session.whiteboardUrls && session.whiteboardUrls.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      📊 {session.whiteboardUrls.length} whiteboard(s)
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

