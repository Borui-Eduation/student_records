'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Grid2X2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { SessionType } from '@student-record/shared';
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
import { SessionTypeDialog } from '@/components/session-types/SessionTypeDialog';

export default function SessionTypesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<SessionType | null>(null);
  const [deletingType, setDeletingType] = useState<SessionType | null>(null);

  const utils = trpc.useUtils();

  // Query session types
  const { data, isLoading, error } = trpc.sessionTypes.list.useQuery({
    limit: 100,
  });

  const sessionTypes = (data?.items || []) as SessionType[];

  // Delete mutation
  const deleteMutation = trpc.sessionTypes.delete.useMutation({
    onSuccess: () => {
      utils.sessionTypes.list.invalidate();
      setDeletingType(null);
    },
    onError: (error) => {
      alert(`Failed to delete: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Types</h1>
          <p className="text-muted-foreground">Manage custom session type categories</p>
        </div>
        <Button onClick={() => {
          setEditingType(null);
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Session Type
        </Button>
      </div>

      <SessionTypeDialog
        open={isCreateDialogOpen || !!editingType}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingType(null);
          }
        }}
        sessionType={editingType}
      />

      <AlertDialog
        open={!!deletingType}
        onOpenChange={(open) => !open && setDeletingType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session Type?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingType?.name}&quot;? This action cannot be undone.
              {deletingType && (
                <span className="block mt-2">
                  Make sure this session type is not being used by any sessions.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingType && deleteMutation.mutate({ id: deletingType.id })}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading session types: {error.message}</p>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessionTypes.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Grid2X2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No session types configured yet</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setEditingType(null);
                    setIsCreateDialogOpen(true);
                  }}
                  className="mt-2"
                >
                  Create your first session type
                </Button>
              </CardContent>
            </Card>
          ) : (
            sessionTypes.map((type) => (
              <Card key={type.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{type.name}</CardTitle>
                  <CardDescription className="text-xs">
                    ID: {type.id.substring(0, 8)}...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingType(type);
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeletingType(type)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

