'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateKnowledgeEntrySchema, type CreateKnowledgeEntryInput } from '@student-record/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface KnowledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId?: string; // If provided, show entry details
}

export function KnowledgeDialog({ open, onOpenChange, entryId }: KnowledgeDialogProps) {
  const utils = trpc.useUtils();
  const [showContent, setShowContent] = useState(false);

  // Fetch entry details if viewing existing entry
  const { data: entry } = trpc.knowledgeBase.get.useQuery(
    { id: entryId! },
    { enabled: !!entryId }
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<CreateKnowledgeEntryInput>({
    resolver: zodResolver(CreateKnowledgeEntrySchema),
    defaultValues: {
      type: 'note',
      requireEncryption: false,
      tags: [],
    },
  });

  const createMutation = trpc.knowledgeBase.create.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
      reset();
      onOpenChange(false);
    },
  });

  const onSubmit = async (data: CreateKnowledgeEntryInput) => {
    await createMutation.mutateAsync(data);
  };

  // If viewing existing entry
  if (entryId && entry) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {entry.isEncrypted && <Lock className="h-5 w-5 text-red-500" />}
              {entry.title}
            </DialogTitle>
            <DialogDescription>
              <span className="text-xs px-2 py-1 rounded-full bg-muted">
                {entry.type}
              </span>
              {entry.category && <span className="ml-2">{entry.category}</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Content</Label>
              <div className="relative mt-2">
                {entry.isEncrypted && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="absolute right-2 top-2 z-10"
                    onClick={() => setShowContent(!showContent)}
                  >
                    {showContent ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Show
                      </>
                    )}
                  </Button>
                )}
                <Textarea
                  value={showContent || !entry.isEncrypted ? entry.content : '••••••••••••••••'}
                  readOnly
                  className="font-mono text-sm min-h-[200px]"
                />
              </div>
            </div>

            {entry.tags && entry.tags.length > 0 && (
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {entry.tags.map((tag: string) => (
                    <span key={tag} className="text-sm px-2 py-1 bg-muted rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Accessed:</span>
                <span className="ml-2 font-medium">{entry.accessCount || 0} times</span>
              </div>
              {entry.isEncrypted && (
                <div>
                  <span className="text-muted-foreground">Encryption:</span>
                  <span className="ml-2 font-medium text-green-600">
                    ✓ KMS Encrypted
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Create new entry form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create Knowledge Entry</DialogTitle>
            <DialogDescription>
              Store sensitive information securely with optional encryption
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Entry title"
                {...register('title')}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                  <SelectItem value="ssh-record">SSH Record</SelectItem>
                  <SelectItem value="password">Password</SelectItem>
                  <SelectItem value="memo">Memo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="grid gap-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Enter your content here"
                {...register('content')}
                className={`font-mono text-sm ${errors.content ? 'border-destructive' : ''}`}
                rows={6}
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>

            {/* Encryption Toggle */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <input
                type="checkbox"
                id="requireEncryption"
                {...register('requireEncryption')}
                className="h-4 w-4"
              />
              <Label htmlFor="requireEncryption" className="cursor-pointer flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Encrypt this entry (recommended for sensitive data)</span>
              </Label>
            </div>
            <p className="text-xs text-muted-foreground -mt-2 ml-6">
              Note: API Keys, SSH Records, and Passwords are automatically encrypted
            </p>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                placeholder="e.g., Production, Development, Client Accounts"
                {...register('category')}
              />
            </div>

            {/* Tags */}
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (Optional)</Label>
              <Input
                id="tags"
                placeholder="Separate with commas: aws, production, api"
                onChange={(e) => {
                  const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                  setValue('tags', tags);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Use tags to organize and search entries
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Entry'}
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

