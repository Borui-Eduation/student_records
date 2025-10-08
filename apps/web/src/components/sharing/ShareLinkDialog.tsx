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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { Copy, ExternalLink } from 'lucide-react';

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateShareLinkFormSchema = z.object({
  sessionId: z.string().min(1, 'Session is required'),
  expiresInDays: z.number().min(1).max(365),
});

type CreateShareLinkFormInput = z.infer<typeof CreateShareLinkFormSchema>;

export function ShareLinkDialog({ open, onOpenChange }: ShareLinkDialogProps) {
  const utils = trpc.useUtils();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Get sessions
  const { data: sessions } = trpc.sessions.list.useQuery({
    limit: 100,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateShareLinkFormInput>({
    resolver: zodResolver(CreateShareLinkFormSchema),
    defaultValues: {
      expiresInDays: 90,
    },
  });

  const createMutation = trpc.sharingLinks.create.useMutation({
    onSuccess: (data) => {
      utils.sharingLinks.list.invalidate();
      setGeneratedLink(data.url);
    },
  });

  const onSubmit = async (data: CreateShareLinkFormInput) => {
    await createMutation.mutateAsync({
      sessionId: data.sessionId,
      expiresInDays: data.expiresInDays,
    });
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleClose = () => {
    reset();
    setGeneratedLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  // If link is generated, show success screen
  if (generatedLink) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sharing Link Created!</DialogTitle>
            <DialogDescription>
              Your sharing link has been created successfully. Share it with your client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2">✓ Link created successfully</p>
              <div className="flex items-center gap-2 p-3 bg-white rounded-md font-mono text-sm">
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 break-all">{generatedLink}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                className="flex-1"
              >
                {copied ? (
                  <>✓ Copied to Clipboard</>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(generatedLink, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Create form
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create Sharing Link</DialogTitle>
            <DialogDescription>
              Generate a secure link to share session content with your client
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Session Selection */}
            <div className="grid gap-2">
              <Label htmlFor="sessionId">Session *</Label>
              <Select
                value={watch('sessionId') || ''}
                onValueChange={(value) => setValue('sessionId', value)}
              >
                <SelectTrigger className={!watch('sessionId') && errors.sessionId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {sessions?.items.map((session: any) => (
                    <SelectItem key={session.id} value={session.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span>{session.clientName}</span>
                        <span className="text-sm text-muted-foreground">
                          {session.date?.toDate
                            ? new Date(session.date.toDate()).toISOString().split('T')[0]
                            : 'N/A'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!watch('sessionId') && errors.sessionId && (
                <p className="text-sm text-destructive">{errors.sessionId.message}</p>
              )}
            </div>

            {/* Expiration Days */}
            <div className="grid gap-2">
              <Label htmlFor="expiresInDays">Expires In (Days) *</Label>
              <Input
                id="expiresInDays"
                type="number"
                min="1"
                max="365"
                {...register('expiresInDays', { valueAsNumber: true })}
                className={errors.expiresInDays ? 'border-destructive' : ''}
              />
              {errors.expiresInDays && (
                <p className="text-sm text-destructive">{errors.expiresInDays.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Default: 90 days. The link will automatically expire after this period.
              </p>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">ℹ️ Note:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>The sharing link will not include billing information</li>
                <li>Access is tracked automatically</li>
                <li>You can revoke the link at any time</li>
                <li>Expired links cannot be accessed</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Link'}
            </Button>
          </DialogFooter>

          {createMutation.error && (
            <p className="mt-2 text-sm text-destructive">
              Error: {createMutation.error.message}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

