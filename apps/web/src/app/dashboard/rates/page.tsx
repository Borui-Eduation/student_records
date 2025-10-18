'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { RateDialog } from '@/components/rates/RateDialog';
import { format } from 'date-fns';
import { toDate } from '@/lib/utils';
import type { Rate } from '@student-record/shared';
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

export default function RatesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<Rate | null>(null);
  const [deletingRate, setDeletingRate] = useState<Rate | null>(null);

  const utils = trpc.useUtils();

  // Query rates
  const { data, isLoading, error } = trpc.rates.list.useQuery({
    limit: 50,
  });

  const rates = (data?.items || []) as Rate[];

  // Query clients for reference
  const { data: clients } = trpc.clients.list.useQuery({
    active: true,
    limit: 100,
  });

  // Query client types for reference
  const { data: clientTypes } = trpc.clientTypes.list.useQuery({
    limit: 100,
  });

  // Delete mutation
  const deleteMutation = trpc.rates.delete.useMutation({
    onSuccess: () => {
      utils.rates.list.invalidate();
      setDeletingRate(null);
    },
  });

  const getClientName = (clientId?: string): string | null => {
    if (!clientId || !clients) {
      return null;
    }
    const client = clients.items.find((c) => c.id === clientId);
    return client && 'name' in client ? (client.name as string) : null;
  };

  const getClientTypeName = (clientTypeId?: string): string | null => {
    if (!clientTypeId || !clientTypes) {
      return null;
    }
    const clientType = clientTypes.items.find((ct) => ct.id === clientTypeId);
    return clientType ? (clientType as any).name : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rates</h1>
          <p className="text-muted-foreground">Manage hourly rates for clients and services</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Rate
        </Button>
      </div>

      <RateDialog
        open={isCreateDialogOpen || !!editingRate}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingRate(null);
          }
        }}
        rate={editingRate}
      />

      <AlertDialog open={!!deletingRate} onOpenChange={(open) => !open && setDeletingRate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set an end date for this rate, effectively deactivating it. You can still
              edit it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRate && deleteMutation.mutate({ id: deletingRate.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading rates: {error.message}</p>
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
          {rates.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No rates configured yet</p>
                <Button variant="link" onClick={() => setIsCreateDialogOpen(true)} className="mt-2">
                  Create your first rate
                </Button>
              </CardContent>
            </Card>
          ) : (
            rates.map((rate: Rate) => (
              <Card key={rate.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold">
                        ¥{rate.amount.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground ml-2">/hour</span>
                      </CardTitle>
                      <CardDescription>
                        {getClientName(rate.clientId) ||
                          getClientTypeName(rate.clientTypeId) ||
                          'General Rate'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingRate(rate)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingRate(rate)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {rate.category && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Category: </span>
                        <span className="font-medium">{rate.category}</span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Effective Date: </span>
                      <span className="font-medium">
                        {rate.effectiveDate ? format(toDate(rate.effectiveDate), 'yyyy-MM-dd') : 'N/A'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">End Date: </span>
                      <span className="font-medium">
                        {rate.endDate ? format(toDate(rate.endDate), 'yyyy-MM-dd') : 'N/A'}
                      </span>
                    </div>
                    {rate.description && (
                      <div className="mt-3 text-muted-foreground">
                        {rate.description}
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


