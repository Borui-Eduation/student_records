'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Clock, Pencil, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { SessionDialog } from '@/components/sessions/SessionDialog';
import { format } from 'date-fns';
import type { Session, Timestamp } from '@student-record/shared';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Helper function to convert Timestamp to Date
function toDate(timestamp: Timestamp): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date();
}

export default function SessionsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [deletingSession, setDeletingSession] = useState<Session | null>(null);

  const utils = trpc.useUtils();

  // Query sessions
  const { data, isLoading, error } = trpc.sessions.list.useQuery({
    limit: 50,
  });

  const sessions = (data?.items || []) as Session[];

  // Delete mutation
  const deleteMutation = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      utils.sessions.list.invalidate();
      setDeletingSession(null);
    },
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

  const getSessionTypeColor = (type: string | undefined) => {
    if (!type) {
      return 'text-gray-600 bg-gray-50';
    }
    return type === 'education'
      ? 'text-purple-600 bg-purple-50'
      : 'text-orange-600 bg-orange-50';
  };

  const getSessionTypeLabel = (type: string | undefined) => {
    if (!type) {
      return 'Unknown';
    }
    return type === 'education' ? 'Education' : 'Technical';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Sessions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track and manage your teaching sessions</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </Button>
      </div>

      <SessionDialog
        open={isCreateDialogOpen || !!editingSession}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingSession(null);
          }
        }}
        session={editingSession}
      />

      <AlertDialog
        open={!!deletingSession}
        onOpenChange={(open) => !open && setDeletingSession(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this session. This action cannot be undone.
              {deletingSession?.billingStatus === 'billed' ||
              deletingSession?.billingStatus === 'paid' ? (
                <span className="block mt-2 text-destructive font-medium">
                  Note: This session has been billed or paid and cannot be deleted.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSession && deleteMutation.mutate({ id: deletingSession.id })}
              disabled={
                deleteMutation.isPending ||
                deletingSession?.billingStatus === 'billed' ||
                deletingSession?.billingStatus === 'paid'
              }
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        <div className="grid gap-3 sm:gap-4">
          {sessions.length === 0 ? (
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
            sessions.map((session: Session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl">{session.clientName}</CardTitle>
                      <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {session.date ? format(toDate(session.date), 'yyyy-MM-dd') : 'N/A'}
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
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2">
                      <div className="text-xl sm:text-2xl font-bold">
                        ¥{session.totalAmount?.toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getSessionTypeColor(
                            session.sessionType
                          )}`}
                        >
                          {getSessionTypeLabel(session.sessionType)}
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
                <CardContent className="pt-3 sm:pt-6">
                  <div className="flex flex-row items-center justify-between sm:grid sm:grid-cols-2 gap-3 sm:gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingSession(session)}
                        className="h-9 w-9"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingSession(session)}
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        disabled={
                          session.billingStatus === 'billed' || session.billingStatus === 'paid'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground text-right sm:text-left">
                      Rate: <span className="font-medium text-foreground">¥{session.rateAmount}</span>
                    </div>
                  </div>
                  {session.notes && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      {session.notes && (
                        <div>
                          <div className="text-sm font-medium mb-2">📝 笔记 Notes:</div>
                          <div className="text-sm text-muted-foreground line-clamp-3">
                            {session.notes.substring(0, 200)}
                            {session.notes.length > 200 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {session.contentBlocks && session.contentBlocks.length > 0 && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      📝 {session.contentBlocks.length} content block(s)
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


