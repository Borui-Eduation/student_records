'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { ClientDialog } from '@/components/clients/ClientDialog';
import type { Client, ClientType } from '@professional-workspace/shared';
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

export default function ClientsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const utils = trpc.useUtils();

  // Query clients
  const { data, isLoading, error } = trpc.clients.list.useQuery({
    active: true,
    limit: 50,
  }) as { data?: { items: Client[]; total: number; hasMore: boolean }; isLoading: boolean; error: unknown };

  // Query client types for reference
  const { data: clientTypes } = trpc.clientTypes.list.useQuery({
    limit: 100,
  });
  const clientTypeItems = (clientTypes?.items || []) as ClientType[];

  // Helper function to get client type name
  const getClientTypeName = (clientTypeId?: string): string => {
    if (!clientTypeId || !clientTypeItems) {
      return 'No Type';
    }
    const clientType = clientTypeItems.find((ct: ClientType) => ct.id === clientTypeId);
    return clientType ? clientType.name : 'Unknown Type';
  };

  // Delete mutation
  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      setDeletingClient(null);
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Clients</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your clients and their information</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      <ClientDialog
        open={isCreateDialogOpen || !!editingClient}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingClient(null);
          }
        }}
        client={editingClient}
      />

      <AlertDialog
        open={!!deletingClient}
        onOpenChange={(open) => !open && setDeletingClient(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the client &quot;{deletingClient?.name}&quot;. You can reactivate
              them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingClient && deleteMutation.mutate({ id: deletingClient.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading clients: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </CardContent>
        </Card>
      ) : null}

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
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {data.items.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">No clients found</p>
                <Button variant="link" onClick={() => setIsCreateDialogOpen(true)} className="mt-2">
                  Create your first client
                </Button>
              </CardContent>
            </Card>
          ) : (
            data.items.map((client: Client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">{client.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {getClientTypeName(client.clientTypeId)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1 sm:gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingClient(client)}
                        className="h-9 w-9"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingClient(client)}
                        className="h-9 w-9 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {client.contactInfo?.email && (
                      <div>
                        <span className="font-medium">Email:</span> {client.contactInfo.email}
                      </div>
                    )}
                    {client.contactInfo?.phone && (
                      <div>
                        <span className="font-medium">Phone:</span> {client.contactInfo.phone}
                      </div>
                    )}
                    {client.notes && (
                      <div className="mt-2 text-muted-foreground">
                        {client.notes.substring(0, 100)}
                        {client.notes.length > 100 && '...'}
                      </div>
                    )}
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

