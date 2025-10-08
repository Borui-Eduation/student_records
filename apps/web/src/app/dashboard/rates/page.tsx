'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, DollarSign } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { RateDialog } from '@/components/rates/RateDialog';
import { format } from 'date-fns';

export default function RatesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Query rates
  const { data, isLoading, error } = trpc.rates.list.useQuery({
    limit: 50,
  });

  // Query clients for reference
  const { data: clients } = trpc.clients.list.useQuery({
    active: true,
    limit: 100,
  });

  const getClientName = (clientId?: string) => {
    if (!clientId || !clients) return null;
    const client = clients.items.find((c: any) => c.id === clientId);
    return client?.name;
  };

  const getClientType = (clientType?: string) => {
    if (!clientType) return null;
    return clientType.charAt(0).toUpperCase() + clientType.slice(1);
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

      <RateDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

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
          {data.items.length === 0 ? (
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
            data.items.map((rate: any) => (
              <Card key={rate.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    ¥{rate.amount.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-2">/hour</span>
                  </CardTitle>
                  <CardDescription>
                    {getClientName(rate.clientId) || getClientType(rate.clientType) || 'General Rate'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Effective Date:</span>
                      <span className="font-medium">
                        {rate.effectiveDate?.toDate
                          ? format(rate.effectiveDate.toDate(), 'yyyy-MM-dd')
                          : 'N/A'}
                      </span>
                    </div>
                    {rate.endDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date:</span>
                        <span className="font-medium">
                          {rate.endDate?.toDate
                            ? format(rate.endDate.toDate(), 'yyyy-MM-dd')
                            : 'N/A'}
                        </span>
                      </div>
                    )}
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

