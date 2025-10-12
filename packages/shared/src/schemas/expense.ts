import { z } from 'zod';

// 支付方式验证
export const PaymentMethodSchema = z.enum([
  'cash',
  'credit_card',
  'debit_card',
  'alipay',
  'wechat',
  'other'
]);

// 创建费用
export const CreateExpenseSchema = z.object({
  date: z.string(), // ISO date string
  amount: z.number().positive('金额必须大于0'),
  currency: z.string().default('CNY'),
  category: z.string().min(1, '请选择分类'),
  description: z.string().min(1, '请输入描述').max(500, '描述不能超过500字符'),
  merchant: z.string().max(200).optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  tags: z.array(z.string()).optional(),
  clientId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  // 图片上传将在后端处理
  imageData: z.string().optional(), // Base64 encoded image
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

// 更新费用
export const UpdateExpenseSchema = z.object({
  id: z.string(),
  date: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  category: z.string().optional(),
  description: z.string().min(1).max(500).optional(),
  merchant: z.string().max(200).optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  tags: z.array(z.string()).optional(),
  clientId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  imageData: z.string().optional(),
  removeImage: z.boolean().optional(), // 标记删除图片
});

export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;

// 列表查询
export const ListExpensesSchema = z.object({
  category: z.string().optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  clientId: z.string().optional(),
  dateRange: z.object({
    start: z.string(), // ISO date
    end: z.string(),   // ISO date
  }).optional(),
  tags: z.array(z.string()).optional(),
  searchQuery: z.string().optional(), // 搜索描述、商家
  sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(50),
  cursor: z.string().optional(), // 分页游标
});

export type ListExpensesInput = z.infer<typeof ListExpensesSchema>;

// 统计查询
export const GetStatisticsSchema = z.object({
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  category: z.string().optional(),
  groupBy: z.enum(['category', 'month', 'paymentMethod']).optional(),
  granularity: z.enum(['day', 'week', 'month']).optional().default('month'),
});

export type GetStatisticsInput = z.infer<typeof GetStatisticsSchema>;

// 批量删除
export const BatchDeleteExpensesSchema = z.object({
  ids: z.array(z.string()).min(1, '至少选择一条记录'),
});

export type BatchDeleteExpensesInput = z.infer<typeof BatchDeleteExpensesSchema>;

// 导出数据
export const ExportExpensesSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  category: z.string().optional(),
});

export type ExportExpensesInput = z.infer<typeof ExportExpensesSchema>;




