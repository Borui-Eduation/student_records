'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Download, Trash2, Send, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { InvoiceGeneratorDialog } from '@/components/invoices/InvoiceGeneratorDialog';
import { format } from 'date-fns';
import { toDate } from '@/lib/utils';
import type { Invoice } from '@professional-workspace/shared';
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

export default function InvoicesPage() {
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  const utils = trpc.useUtils();

  // Query invoices
  const { data, isLoading, error } = trpc.invoices.list.useQuery({
    limit: 50,
  });

  const invoices = (data?.items || []) as Invoice[];

  // Update status mutation
  const updateStatusMutation = trpc.invoices.updateStatus.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
    },
  });

  // Delete mutation
  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
      setDeletingInvoice(null);
    },
  });

  const handleSendInvoice = (invoiceId: string) => {
    updateStatusMutation.mutate({
      id: invoiceId,
      status: 'sent',
    });
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    updateStatusMutation.mutate({
      id: invoiceId,
      status: 'paid',
      paidDate: new Date().toISOString(),
    });
  };

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Invoices</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Generate and manage invoices from sessions</p>
        </div>
        <Button onClick={() => setIsGenerateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </div>

      <InvoiceGeneratorDialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
      />

      <AlertDialog
        open={!!deletingInvoice}
        onOpenChange={(open) => !open && setDeletingInvoice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice &quot;{deletingInvoice?.invoiceNumber}&quot; and
              revert all associated sessions to unbilled status.
              {deletingInvoice?.status !== 'draft' && (
                <span className="block mt-2 text-destructive font-medium">
                  Only draft invoices can be deleted!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingInvoice && deleteMutation.mutate({ id: deletingInvoice.id })}
              disabled={deleteMutation.isPending || deletingInvoice?.status !== 'draft'}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        <div className="grid gap-3 sm:gap-4">
          {invoices.length === 0 ? (
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
            invoices.map((invoice: Invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg sm:text-xl flex flex-col sm:flex-row sm:items-center gap-2">
                        {invoice.invoiceNumber}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-2 text-xs sm:text-sm">
                        {invoice.clientName}
                      </CardDescription>
                    </div>
                    <div className="text-right sm:text-right">
                      <div className="text-2xl sm:text-3xl font-bold">
                        ${invoice.totalAmount?.toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {invoice.currency}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span className="ml-2 font-medium">
                        {invoice.issueDate ? (() => {
                          const date = toDate(invoice.issueDate);
                          return date ? format(date, 'yyyy-MM-dd') : 'N/A';
                        })() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Billing Period:</span>
                      <span className="ml-2 font-medium">
                        {invoice.billingPeriodStart && invoice.billingPeriodEnd
                          ? (() => {
                            const startDate = toDate(invoice.billingPeriodStart);
                            const endDate = toDate(invoice.billingPeriodEnd);
                            return startDate && endDate ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}` : 'N/A';
                          })()
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
                      <span className="font-medium">${invoice.subtotal?.toLocaleString()}</span>
                    </div>
                    {invoice.taxAmount > 0 && (
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-muted-foreground">Tax:</span>
                        <span className="font-medium">${invoice.taxAmount?.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {invoice.paidDate && (() => {
                    const date = toDate(invoice.paidDate);
                    return date ? (
                      <div className="mt-4 text-sm text-green-600">
                        ✓ Paid on {format(date, 'yyyy-MM-dd')}
                      </div>
                    ) : null;
                  })()}

                  {invoice.paymentNotes && (
                    <div className="mt-4 text-sm text-muted-foreground border-t pt-4">
                      <strong>Notes:</strong> {invoice.paymentNotes}
                    </div>
                  )}

                  <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:flex-wrap">
                    {invoice.pdfUrl && (
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    )}
                    {invoice.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendInvoice(invoice.id)}
                          disabled={updateStatusMutation.isPending}
                          className="w-full sm:w-auto"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Send Invoice
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingInvoice(invoice)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:text-destructive w-full sm:w-auto"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </>
                    )}
                    {invoice.status === 'sent' && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid(invoice.id)}
                        disabled={updateStatusMutation.isPending}
                        className="w-full sm:w-auto"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Paid
                      </Button>
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


