'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Share2, Copy, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { ShareLinkDialog } from '@/components/sharing/ShareLinkDialog';
import { format, formatDistanceToNow } from 'date-fns';
import type { SharingLink, Timestamp } from '@student-record/shared';

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

export default function SharingPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Query sharing links
  const { data, isLoading, error } = trpc.sharingLinks.list.useQuery({
    limit: 50,
  });

  const sharingLinks = (data?.items || []) as unknown as SharingLink[];

  const revokeMutation = trpc.sharingLinks.revoke.useMutation({
    onSuccess: () => {
      utils.sharingLinks.list.invalidate();
    },
  });

  const utils = trpc.useUtils();

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy:', error);
    }
  };

  const isExpired = (expiresAt: Timestamp) => {
    if (!expiresAt) {
      return false;
    }
    return toDate(expiresAt) < new Date();
  };

  const getStatusColor = (link: SharingLink) => {
    if (link.revoked) {
      return 'text-red-600 bg-red-100';
    }
    if (isExpired(link.expiresAt)) {
      return 'text-gray-600 bg-gray-100';
    }
    return 'text-green-600 bg-green-100';
  };

  const getStatusText = (link: SharingLink) => {
    if (link.revoked) {
      return 'Revoked';
    }
    if (isExpired(link.expiresAt)) {
      return 'Expired';
    }
    return 'Active';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sharing Links</h1>
          <p className="text-muted-foreground">
            Create secure links to share session content with clients
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Link
        </Button>
      </div>

      <ShareLinkDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Error loading sharing links: {error.message}
            </p>
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
                <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No sharing links created yet</p>
                <Button
                  variant="link"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-2"
                >
                  Create your first sharing link
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="divide-y border rounded-lg">
              {sharingLinks.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No sharing links created yet.
                </div>
              ) : (
                sharingLinks.map((link: SharingLink) => (
                  <Card key={link.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${getStatusColor(link)}`} />
                            Shared Session
                          </CardTitle>
                          <CardDescription className="mt-1 text-xs">
                            ID: {link.sessionId}
                          </CardDescription>
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                            link
                          )}`}
                        >
                          {getStatusText(link)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* URL Display */}
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-sm">
                          <ExternalLink className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 truncate">{link.url || 'N/A'}</div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(link.url || '', link.id)}
                            disabled={!link.url}
                          >
                            {copiedId === link.id ? (
                              <>✓ Copied</>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Created:</span>
                            <span className="ml-2 font-medium">
                              {link.createdAt
                                ? formatDistanceToNow(toDate(link.createdAt), { addSuffix: true })
                                : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expires:</span>
                            <span className="ml-2 font-medium">
                              {link.expiresAt
                                ? format(toDate(link.expiresAt), 'yyyy-MM-dd')
                                : 'N/A'}
                              {link.expiresAt && !isExpired(link.expiresAt) && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({formatDistanceToNow(toDate(link.expiresAt), { addSuffix: true })})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {link.lastAccessedAt && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Last Accessed:</span>
                            <span className="ml-2 font-medium">
                              {formatDistanceToNow(toDate(link.lastAccessedAt), { addSuffix: true })}
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {!link.revoked && !isExpired(link.expiresAt) && link.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(link.url!, '_blank')}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open Link
                            </Button>
                          )}
                          {!link.revoked && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => revokeMutation.mutate({ id: link.id })}
                              disabled={revokeMutation.isPending}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


