'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';
import type { Session, Timestamp } from '@student-record/shared';

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

interface InvoiceGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerateInvoiceFormSchema = z.object({
  notes: z.string().optional(),
});

type GenerateInvoiceFormInput = z.infer<typeof GenerateInvoiceFormSchema>;

export function InvoiceGeneratorDialog({ open, onOpenChange }: InvoiceGeneratorDialogProps) {
  const utils = trpc.useUtils();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);

  // Get clients
  const { data: clients } = trpc.clients.list.useQuery({
    active: true,
    limit: 100,
  });

  // Get unbilled sessions for selected client
  const { data: sessions } = trpc.sessions.list.useQuery(
    {
      clientId: selectedClientId,
      billingStatus: 'unbilled',
      limit: 100,
    },
    {
      enabled: !!selectedClientId,
    }
  );

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<GenerateInvoiceFormInput>({
    resolver: zodResolver(GenerateInvoiceFormSchema),
  });

  const generateMutation = trpc.invoices.generate.useMutation({
    onSuccess: () => {
      utils.invoices.list.invalidate();
      utils.sessions.list.invalidate();
      reset();
      setSelectedClientId('');
      setSelectedSessionIds([]);
      onOpenChange(false);
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('Invoice generation error:', error);
    },
  });

  const onSubmit = async (data: GenerateInvoiceFormInput) => {
    // Validate manually since these fields are in state, not in the form
    if (!selectedClientId) {
      return;
    }
    if (selectedSessionIds.length === 0) {
      return;
    }

    await generateMutation.mutateAsync({
      clientId: selectedClientId,
      sessionIds: selectedSessionIds,
      notes: data.notes,
    });
  };

  const toggleSession = (sessionId: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  };

  const sessionItems = (sessions?.items || []) as Session[];
  const selectedTotal = sessionItems
    .filter((s) => selectedSessionIds.includes(s.id))
    .reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Select a client and unbilled sessions to generate an invoice
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Client Selection */}
            <div className="grid gap-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select
                value={selectedClientId}
                onValueChange={(value) => {
                  setSelectedClientId(value);
                  setSelectedSessionIds([]); // Reset selected sessions
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.items.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {'name' in client ? String(client.name) : 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sessions Selection */}
            {selectedClientId && (
              <div className="grid gap-2">
                <Label>Unbilled Sessions *</Label>
                {sessionItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No unbilled sessions for this client
                  </p>
                ) : (
                  <div className="border rounded-md p-3 max-h-[300px] overflow-y-auto">
                    {sessionItems.map((session) => (
                      <div
                        key={session.id}
                        className={`flex items-start gap-3 p-3 rounded cursor-pointer hover:bg-muted transition-colors ${
                          selectedSessionIds.includes(session.id) ? 'bg-muted' : ''
                        }`}
                        onClick={() => toggleSession(session.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSessionIds.includes(session.id)}
                          onChange={() => {}}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">
                                {session.date
                                  ? format(toDate(session.date), 'yyyy-MM-dd')
                                  : 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {session.startTime} - {session.endTime} ({session.durationHours}h)
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {session.sessionType === 'education' ? 'Education' : 'Technical'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">¥{session.totalAmount?.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">
                                @¥{session.rateAmount}/h
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selected Total */}
            {selectedSessionIds.length > 0 && (
              <div className="bg-muted p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Selected Sessions:</span>
                  <span>{selectedSessionIds.length}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>¥{selectedTotal.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Payment instructions, terms, etc."
                {...register('notes')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedClientId('');
                setSelectedSessionIds([]);
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedSessionIds.length === 0}
            >
              {isSubmitting ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </DialogFooter>

          {generateMutation.error && (
            <p className="mt-2 text-sm text-destructive">
              Error: {generateMutation.error.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}


