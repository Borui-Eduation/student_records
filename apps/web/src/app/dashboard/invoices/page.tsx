'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Download } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { InvoiceGeneratorDialog } from '@/components/invoices/InvoiceGeneratorDialog';
import { format } from 'date-fns';

export default function InvoicesPage() {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  // Query invoices
  const { data, isLoading, error } = trpc.invoices.list.useQuery({
    limit: 50,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'sent':
        return 'text-blue-600 bg-blue-100';
      case 'paid':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Generate and manage invoices from sessions</p>
        </div>
        <Button onClick={() => setIsGenerateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </div>

      <InvoiceGeneratorDialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
      />

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading invoices: {error.message}</p>
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
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No invoices generated yet</p>
                <Button
                  variant="link"
                  onClick={() => setIsGenerateDialogOpen(true)}
                  className="mt-2"
                >
                  Generate your first invoice
                </Button>
              </CardContent>
            </Card>
          ) : (
            data.items.map((invoice: any) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {invoice.invoiceNumber}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {invoice.clientName}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">
                        ¥{invoice.totalAmount?.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {invoice.currency}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span className="ml-2 font-medium">
                        {invoice.issueDate?.toDate
                          ? format(invoice.issueDate.toDate(), 'yyyy-MM-dd')
                          : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Billing Period:</span>
                      <span className="ml-2 font-medium">
                        {invoice.billingPeriodStart?.toDate &&
                        invoice.billingPeriodEnd?.toDate
                          ? `${format(invoice.billingPeriodStart.toDate(), 'MMM d')} - ${format(
                              invoice.billingPeriodEnd.toDate(),
                              'MMM d, yyyy'
                            )}`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-muted-foreground">Line Items:</span>
                      <span className="font-medium">
                        {invoice.lineItems?.length || 0} session(s)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">¥{invoice.subtotal?.toLocaleString()}</span>
                    </div>
                    {invoice.taxAmount > 0 && (
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-muted-foreground">Tax:</span>
                        <span className="font-medium">¥{invoice.taxAmount?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {invoice.paidDate && (
                    <div className="mt-4 text-sm text-green-600">
                      ✓ Paid on{' '}
                      {invoice.paidDate?.toDate
                        ? format(invoice.paidDate.toDate(), 'yyyy-MM-dd')
                        : 'N/A'}
                    </div>
                  )}

                  {invoice.notes && (
                    <div className="mt-4 text-sm text-muted-foreground border-t pt-4">
                      <strong>Notes:</strong> {invoice.notes}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {invoice.pdfUrl && (
                      <Button size="sm" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    )}
                    {invoice.status === 'draft' && (
                      <Button size="sm" variant="outline">
                        Send Invoice
                      </Button>
                    )}
                    {invoice.status === 'sent' && (
                      <Button size="sm">Mark as Paid</Button>
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

