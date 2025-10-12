'use client';

import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { ContentBlock } from '@student-record/shared';

export default function SharedSessionPage() {
  const params = useParams();
  const token = params.token as string;

  const { data, isLoading, error } = trpc.sharingLinks.getByToken.useQuery(
    { token },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-sm text-muted-foreground">Loading session...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This link may have expired or been revoked. Please contact the session creator for a new link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const session = data?.session;
  const link = data?.link;

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{session?.clientName}</CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {session?.date?.toDate ? format(session.date.toDate(), 'MMMM d, yyyy') : 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {session?.startTime} - {session?.endTime}
                {session?.durationHours && (
                  <span className="text-xs ml-1">({session.durationHours}h)</span>
                )}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Session Type:</span>
                <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded">
                  {session?.sessionType === 'education' ? 'Education' : 'Technical'}
                </span>
              </div>
              <div className="text-muted-foreground">
                Link expires: {link?.expiresAt?.toDate ? format(link.expiresAt.toDate(), 'MMM d, yyyy') : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Blocks */}
        {session?.contentBlocks && session.contentBlocks.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {session.contentBlocks.map((block: ContentBlock) => (
                  <div key={block.id} className="mb-4">
                    {block.type === 'heading' && (
                      <h3 className="text-lg font-semibold">{block.content}</h3>
                    )}
                    {block.type === 'paragraph' && (
                      <p className="text-sm text-muted-foreground">{block.content}</p>
                    )}
                    {block.type === 'bulletList' && (
                      <ul className="list-disc list-inside space-y-1">
                        {block.content.map((item: string, idx: number) => (
                          <li key={idx} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!session?.contentBlocks || session.contentBlocks.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No additional content available for this session
                </p>
              </CardContent>
            </Card>
          )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>This is a read-only view. Accessed {link?.accessCount} time(s).</p>
        </div>
      </div>
    </div>
  );
}


