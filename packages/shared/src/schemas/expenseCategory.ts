import { z } from 'zod';

// 创建自定义分类
export const CreateExpenseCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50字符'),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '颜色必须是有效的hex格式').optional(),
  order: z.number().optional(),
});

export type CreateExpenseCategoryInput = z.infer<typeof CreateExpenseCategorySchema>;

// 更新分类
export const UpdateExpenseCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  order: z.number().optional(),
});

export type UpdateExpenseCategoryInput = z.infer<typeof UpdateExpenseCategorySchema>;

// 列表查询
export const ListExpenseCategoriesSchema = z.object({
  includeSystemPresets: z.boolean().default(true),
  sortBy: z.enum(['name', 'order', 'createdAt']).default('order'),
});

export type ListExpenseCategoriesInput = z.infer<typeof ListExpenseCategoriesSchema>;




