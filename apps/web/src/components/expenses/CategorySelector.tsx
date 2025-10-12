'use client';

import { useState, useEffect } from 'react';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { MobileBottomSheet } from './MobileBottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface CategorySelectorProps {
  value?: string;
  onChange: (value: string, name: string) => void;
  className?: string;
}

export function CategorySelector({ value, onChange, className }: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  // 获取所有分类（包括系统预设）
  const { data: categoriesData, isLoading } = trpc.expenseCategories.list.useQuery({
    includeSystemPresets: true,
    sortBy: 'order',
  }) as any;

  // 初始化分类mutation
  const initCategories = trpc.expenseCategories.initializePresets.useMutation();

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
  const backendCategories = categoriesData?.items || [];
  const backendSystemCategories = backendCategories.filter((c: any) => c.isSystemPreset);
  const customCategories = backendCategories.filter((c: any) => !c.isSystemPreset);

  // 如果后端没有系统预设分类，使用硬编码的预设
  const systemCategories = backendSystemCategories.length > 0 
    ? backendSystemCategories 
    : DEFAULT_SYSTEM_CATEGORIES;

  // 合并系统预设和自定义分类
  const categories = [...systemCategories, ...customCategories];

  // 如果后端没有分类且还没初始化，自动触发初始化
  useEffect(() => {
    if (backendCategories.length === 0 && !isLoading && !initCategories.isLoading) {
      initCategories.mutate();
    }
  }, [backendCategories.length, isLoading]);
  const selectedCategory = categories.find((c: any) => c.id === value);

  const handleSelect = (categoryId: string, categoryName: string) => {
    onChange(categoryId, categoryName);
    setIsOpen(false);
  };

  const renderCategoryGrid = () => (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {categories.map((category: any) => (
        <button
          key={category.id}
          type="button"
          onClick={() => handleSelect(category.id, category.name)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
            'hover:border-blue-500 hover:bg-blue-50',
            'min-h-[100px]',
            value === category.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200'
          )}
        >
          <div
            className="text-3xl w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            {category.icon}
          </div>
          <div className="text-xs font-medium text-center">{category.name}</div>
          {value === category.id && (
            <div className="absolute top-2 right-2">
              <Check className="h-4 w-4 text-blue-600" />
            </div>
          )}
        </button>
      ))}
    </div>
  );

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading categories...</div>
      </div>
    );
  }

  // 移动端使用 Bottom Sheet
  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            'w-full px-4 py-3 rounded-lg border-2 text-left flex items-center gap-3',
            'hover:border-blue-500 transition-colors',
            value ? 'border-gray-300' : 'border-gray-200',
            className
          )}
        >
          {selectedCategory ? (
            <>
              <div
                className="text-2xl w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${selectedCategory.color}20` }}
              >
                {selectedCategory.icon}
              </div>
              <span className="font-medium">{selectedCategory.name}</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Plus className="h-5 w-5 text-gray-400" />
              </div>
              <span className="text-gray-500">Select category</span>
            </>
          )}
        </button>

        <MobileBottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Select Category">
          {renderCategoryGrid()}
        </MobileBottomSheet>
      </>
    );
  }

  // 桌面端直接显示网格
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">Select Category</label>
      {renderCategoryGrid()}
    </div>
  );
}

