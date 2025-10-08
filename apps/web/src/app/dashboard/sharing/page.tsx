'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Share2, Copy, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { ShareLinkDialog } from '@/components/sharing/ShareLinkDialog';
import { format, formatDistanceToNow } from 'date-fns';

export default function SharingPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Query sharing links
  const { data, isLoading, error } = trpc.sharingLinks.list.useQuery({
    limit: 50,
  });

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
      console.error('Failed to copy:', error);
    }
  };

  const isExpired = (expiresAt: any) => {
    if (!expiresAt?.toDate) return false;
    return expiresAt.toDate() < new Date();
  };

  const getStatusColor = (link: any) => {
    if (link.revoked) return 'text-red-600 bg-red-100';
    if (isExpired(link.expiresAt)) return 'text-gray-600 bg-gray-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusText = (link: any) => {
    if (link.revoked) return 'Revoked';
    if (isExpired(link.expiresAt)) return 'Expired';
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
            data.items.map((link: any) => (
              <Card key={link.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {link.sessionClientName}
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(link)}`}>
                          {getStatusText(link)}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Session:{' '}
                        {link.sessionDate?.toDate
                          ? format(link.sessionDate.toDate(), 'yyyy-MM-dd')
                          : 'N/A'}
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">Access Count</div>
                      <div className="text-2xl font-bold">{link.accessCount || 0}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* URL Display */}
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-sm">
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 truncate">{link.url}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(link.url, link.id)}
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
                          {link.createdAt?.toDate
                            ? formatDistanceToNow(link.createdAt.toDate(), { addSuffix: true })
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <span className="ml-2 font-medium">
                          {link.expiresAt?.toDate
                            ? format(link.expiresAt.toDate(), 'yyyy-MM-dd')
                            : 'N/A'}
                          {link.expiresAt?.toDate && !isExpired(link.expiresAt) && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({formatDistanceToNow(link.expiresAt.toDate(), { addSuffix: true })})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {link.lastAccessedAt && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Last Accessed:</span>
                        <span className="ml-2 font-medium">
                          {link.lastAccessedAt?.toDate
                            ? formatDistanceToNow(link.lastAccessedAt.toDate(), { addSuffix: true })
                            : 'Never'}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!link.revoked && !isExpired(link.expiresAt) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(link.url, '_blank')}
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
                          disabled={revokeMutation.isLoading}
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
  );
}

