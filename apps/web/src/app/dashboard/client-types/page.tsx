'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { ClientType } from '@student-record/shared';
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
import { ClientTypeDialog } from '@/components/client-types/ClientTypeDialog';

export default function ClientTypesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ClientType | null>(null);
  const [deletingType, setDeletingType] = useState<ClientType | null>(null);

  const utils = trpc.useUtils();

  // Query client types
  const { data, isLoading, error } = trpc.clientTypes.list.useQuery({
    limit: 100,
  });

  const clientTypes = (data?.items || []) as ClientType[];

  // Delete mutation
  const deleteMutation = trpc.clientTypes.delete.useMutation({
    onSuccess: () => {
      utils.clientTypes.list.invalidate();
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
          <h1 className="text-3xl font-bold">Client Types</h1>
          <p className="text-muted-foreground">Manage custom client type categories</p>
        </div>
        <Button onClick={() => {
          setEditingType(null);
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          New Client Type
        </Button>
      </div>

      <ClientTypeDialog
        open={isCreateDialogOpen || !!editingType}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingType(null);
          }
        }}
        clientType={editingType}
      />

      <AlertDialog
        open={!!deletingType}
        onOpenChange={(open) => !open && setDeletingType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client Type?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingType?.name}&quot;? This action cannot be undone.
              {deletingType && (
                <span className="block mt-2">
                  Make sure this client type is not being used by any clients or rates.
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
            <p className="text-sm text-destructive">Error loading client types: {error.message}</p>
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
          {clientTypes.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No client types configured yet</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setEditingType(null);
                    setIsCreateDialogOpen(true);
                  }}
                  className="mt-2"
                >
                  Create your first client type
                </Button>
              </CardContent>
            </Card>
          ) : (
            clientTypes.map((type) => (
              <Card key={type.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{type.name}</CardTitle>
                      <CardDescription className="text-xs">
                        ID: {type.id.substring(0, 8)}...
                      </CardDescription>
                    </div>
                    {type.color && (
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: type.color }}
                      />
                    )}
                  </div>
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

