'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@professional-workspace/shared';

const PRESET_ICONS = ['📋', '💰', '🎁', '🏋️', '🎨', '✈️', '🔧', '📱', '💻', '🎵', '📚', '🍿'];
const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#95E1D3', '#FFE66D',
  '#A8E6CF', '#FFD3B6', '#FFAAA5', '#A0C4FF',
  '#BDB2FF', '#FFC6FF', '#CAFFBF', '#FDFFB6'
];

export default function CategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: '📋',
    color: '#BDB2FF',
  });

  // 获取分类列表
  const { data: categoriesData, isLoading, refetch } = trpc.expenseCategories.list.useQuery({
    includeSystemPresets: true,
    sortBy: 'order',
  });

  // 初始化预设分类mutation
  const initPresetsMutation = trpc.expenseCategories.initializePresets.useMutation({
    onSuccess: () => {
      // eslint-disable-next-line no-console
      console.log('✅ Preset categories initialized');
      refetch();
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to initialize presets:', error);
    },
  });

  // 如果后端没有返回分类，使用前端预设分类作为fallback
  const backendCategories = categoriesData?.items || [];
  const hasBackendData = backendCategories.length > 0;
  
  // 硬编码的预设分类（确保一定能显示）
  const DEFAULT_SYSTEM_CATEGORIES = [
    { id: 'dining', name: 'Dining', icon: '🍽️', color: '#FF6B6B', isSystemPreset: true },
    { id: 'transportation', name: 'Transportation', icon: '🚗', color: '#4ECDC4', isSystemPreset: true },
    { id: 'automobile', name: 'Automobile', icon: '⛽', color: '#95E1D3', isSystemPreset: true },
    { id: 'housing', name: 'Housing', icon: '🏠', color: '#FFE66D', isSystemPreset: true },
    { id: 'entertainment', name: 'Entertainment', icon: '🎮', color: '#A8E6CF', isSystemPreset: true },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#FFD3B6', isSystemPreset: true },
    { id: 'healthcare', name: 'Healthcare', icon: '💊', color: '#FFAAA5', isSystemPreset: true },
    { id: 'education', name: 'Education', icon: '📚', color: '#A0C4FF', isSystemPreset: true },
    { id: 'other', name: 'Other', icon: '📋', color: '#BDB2FF', isSystemPreset: true },
  ];

  // 从后端数据中筛选系统预设和自定义分类
  const backendSystemCategories = backendCategories.filter((c) => (c as ExpenseCategory).isSystemPreset);
  const customCategories = backendCategories.filter((c) => !(c as ExpenseCategory).isSystemPreset);

  // 如果后端没有系统预设分类，使用硬编码的预设
  const systemCategories = backendSystemCategories.length > 0 
    ? backendSystemCategories 
    : DEFAULT_SYSTEM_CATEGORIES;

  // 自动初始化预设分类（仅当后端没有任何分类时）
  useEffect(() => {
    if (!isLoading && backendCategories.length === 0 && !initPresetsMutation.isPending) {
      initPresetsMutation.mutate();
    }
  }, [backendCategories.length, isLoading]);

  // 创建mutation
  const createMutation = trpc.expenseCategories.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Custom category created',
      });
      setIsCreating(false);
      setFormData({ name: '', icon: '📋', color: '#BDB2FF' });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 删除mutation
  const deleteMutation = trpc.expenseCategories.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Custom category deleted',
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Please enter category name',
        variant: 'destructive',
      });
      return;
    }
    
    createMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this custom category?')) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Category Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your expense categories
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreating(!isCreating)}
          className="hidden sm:flex"
        >
          <Plus className="h-4 w-4 mr-2" />
          Custom Category
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Create Custom Category</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Fitness, Travel"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Select Icon</Label>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mt-2">
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={cn(
                      'text-2xl p-2 rounded-lg border-2 transition-colors',
                      formData.icon === icon
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Select Color</Label>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      'w-10 h-10 rounded-lg border-2 transition-all',
                      formData.color === color
                        ? 'border-gray-900 scale-110'
                        : 'border-gray-200 hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* System Preset Categories */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">System Preset Categories</h2>
          {!hasBackendData && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Local preview (syncing to database...)
            </span>
          )}
        </div>
        {systemCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Loading preset categories...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {systemCategories.map((category) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const cat = category as any;
              return (
              <div
                key={cat.id}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border"
              >
                <div
                  className="text-3xl w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  {cat.icon}
                </div>
                <div className="text-sm font-medium text-center">{cat.name}</div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Categories */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Custom Categories</h2>
          <Button
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
            className="sm:hidden"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        {customCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No custom categories yet
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {customCategories.map((category) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const cat = category as any;
              return (
              <div
                key={cat.id}
                className="relative flex flex-col items-center gap-2 p-4 rounded-lg border group"
              >
                <div
                  className="text-3xl w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  {cat.icon}
                </div>
                <div className="text-sm font-medium text-center">{cat.name}</div>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

