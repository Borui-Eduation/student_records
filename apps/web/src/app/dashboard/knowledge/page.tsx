'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Lock, Search, Tag, Pencil, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { KnowledgeDialog } from '@/components/knowledge/KnowledgeDialog';
import { Input } from '@/components/ui/input';
import type { KnowledgeEntry } from '@student-record/shared';
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

export default function KnowledgePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<KnowledgeEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const utils = trpc.useUtils();

  // Query knowledge entries
  const { data, isLoading, error } = trpc.knowledgeBase.list.useQuery({
    limit: 50,
  });

  // Delete mutation
  const deleteMutation = trpc.knowledgeBase.delete.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
      setDeletingEntry(null);
    },
  });

  // Removed addMarkdownGuide function - guide is now auto-created on user initialization

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'note': 'text-blue-600 bg-blue-100',
      'api-key': 'text-red-600 bg-red-100',
      'ssh-record': 'text-purple-600 bg-purple-100',
      'password': 'text-orange-600 bg-orange-100',
      'memo': 'text-green-600 bg-green-100',
      'query-result': 'text-indigo-600 bg-indigo-100',
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const knowledgeItems = (data?.items || []) as KnowledgeEntry[];

  const filteredItems = knowledgeItems.filter((item: KnowledgeEntry) =>
    searchQuery
      ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Securely store API keys, SSH records, and sensitive information
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>

      <KnowledgeDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

      <AlertDialog
        open={!!deletingEntry}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingEntry?.title}&quot;. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEntry && deleteMutation.mutate({ id: deletingEntry.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or tags..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Error loading knowledge base: {error.message}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems && filteredItems.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'No entries match your search'
                    : 'No entries in knowledge base yet'}
                </p>
                <Button
                  variant="link"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-2"
                >
                  {searchQuery ? 'Clear search' : 'Create your first entry'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredItems?.map((entry: KnowledgeEntry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <CardTitle className="text-lg flex items-center gap-2">
                        {entry.isEncrypted && <Lock className="h-4 w-4 text-red-500" />}
                        {entry.title}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(entry.type)}`}>
                        {entry.type}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEntry(entry);
                        }}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingEntry(entry);
                        }}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {entry.category && (
                    <CardDescription className="mt-2">{entry.category}</CardDescription>
                  )}
                </CardHeader>
                <CardContent
                  className="cursor-pointer"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="text-sm text-muted-foreground">
                    {entry.isEncrypted ? (
                      <span className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        [Encrypted Content]
                      </span>
                    ) : (
                      <p className="line-clamp-2">{entry.content}</p>
                    )}
                  </div>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {entry.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-muted rounded-full flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-muted-foreground">
                    Accessed: {entry.accessCount || 0} times
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Entry Detail Modal (View) */}
      {selectedEntry && (
        <KnowledgeDialog
          open={true}
          onOpenChange={(open) => !open && setSelectedEntry(null)}
          entryId={selectedEntry.id}
        />
      )}

      {/* Entry Edit Modal */}
      {editingEntry && (
        <KnowledgeDialog
          open={true}
          onOpenChange={(open) => !open && setEditingEntry(null)}
          entryId={editingEntry.id}
          editMode={true}
        />
      )}
    </div>
  );
}


