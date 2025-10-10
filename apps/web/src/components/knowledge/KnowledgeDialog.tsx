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
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { FullscreenEditorDialog } from '@/components/ui/fullscreen-editor-dialog';
import { trpc } from '@/lib/trpc';
import { Lock, Eye, EyeOff, Pencil, Maximize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Markdown preview to avoid SSR issues
const MDPreview = dynamic(
  () => import('@uiw/react-markdown-preview').then((mod) => mod.default),
  { ssr: false }
);

interface KnowledgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId?: string; // If provided, show entry details (view mode)
  editMode?: boolean; // If true and entryId provided, edit mode
}

export function KnowledgeDialog({ open, onOpenChange, entryId, editMode = false }: KnowledgeDialogProps) {
  const utils = trpc.useUtils();
  const [showContent, setShowContent] = useState(false);
  const [isEditing, setIsEditing] = useState(editMode);
  const [fullscreenMode, setFullscreenMode] = useState<'content' | null>(null);
  

  // Fetch entry details if viewing existing entry
  const { data: entry } = trpc.knowledgeBase.get.useQuery(
    { id: entryId! },
    { enabled: !!entryId }
  );

  useEffect(() => {
    setIsEditing(editMode);
  }, [editMode, entryId]);

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

  // Populate form when editing
  useEffect(() => {
    if (entry && open && isEditing) {
      setValue('title', entry.title);
      setValue('type', entry.type);
      setValue('content', entry.content);
      setValue('category', entry.category || '');
      setValue('tags', entry.tags || []);
      setValue('requireEncryption', entry.isEncrypted || false);
    } else if (!open) {
      reset({
        type: 'note',
        requireEncryption: false,
        tags: [],
      });
      setIsEditing(editMode);
    }
  }, [entry, open, isEditing, setValue, reset, editMode]);

  const createMutation = trpc.knowledgeBase.create.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
      reset();
      onOpenChange(false);
    },
  });

  const updateMutation = trpc.knowledgeBase.update.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
      setIsEditing(false);
      onOpenChange(false);
    },
  });

  const onSubmit = async (data: CreateKnowledgeEntryInput) => {
    if (isEditing && entryId) {
      await updateMutation.mutateAsync({
        id: entryId,
        ...data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const mutation = isEditing ? updateMutation : createMutation;

  // If viewing existing entry (not editing)
  if (entryId && entry && !isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                {entry.isEncrypted && !showContent ? (
                  <div className="p-3 rounded-md border font-mono min-h-[200px]">
                    ••••••••••••••••
                  </div>
                ) : (
                  <div data-color-mode="light" className="rounded-md border">
                    <MDPreview source={entry.content} style={{ padding: 16 }} />
                  </div>
                )}
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
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Create or edit form
  return (
    <>
      {/* Fullscreen Markdown Editor */}
      <FullscreenEditorDialog
        open={fullscreenMode === 'content'}
        onOpenChange={(open) => !open && setFullscreenMode(null)}
        title="📝 知识库编辑器 / Knowledge Base Editor"
        onSave={() => setFullscreenMode(null)}
      >
        <MarkdownEditor
          value={watch('content') || ''}
          onChange={(value) => {
            setValue('content', value, { 
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true 
            });
          }}
          height="100%"
          preview="live"
          placeholder="# Start writing...

Use Markdown syntax:
- **Bold** and *Italic*
- Lists and checkboxes
- Code blocks
- Tables
- Links and images
- And much more!"
        />
      </FullscreenEditorDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Knowledge Entry' : 'Create Knowledge Entry'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the knowledge entry information' 
                : 'Store sensitive information securely with optional encryption (supports Markdown)'}
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

            {/* Content with Markdown */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Content * (Markdown)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFullscreenMode('content')}
                  className="flex items-center gap-2"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  全屏 Fullscreen
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                📝 Use Markdown for rich text formatting
              </p>
              <input type="hidden" {...register('content')} />
              <MarkdownEditor
                value={watch('content') || ''}
                onChange={(value) => {
                  setValue('content', value, { 
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true 
                  });
                }}
                height={200}
                preview="live"
                placeholder="# Start writing...

Use Markdown syntax:
- **Bold** and *Italic*
- Lists and checkboxes
- Code blocks
- Tables
- Links and images
- And much more!"
              />
              {errors.content && (
                <p className="text-sm text-destructive mt-2">{errors.content.message}</p>
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
                setIsEditing(false);
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                  ? 'Update Entry'
                  : 'Create Entry'}
            </Button>
          </DialogFooter>

            {mutation.error && (
              <p className="mt-2 text-sm text-destructive">Error: {mutation.error.message}</p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}


