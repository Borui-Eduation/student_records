import { z } from 'zod';

export const BillingStatusSchema = z.enum(['unbilled', 'billed', 'paid']);

export const ContentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['heading', 'paragraph', 'bulletList', 'orderedList', 'codeBlock', 'image', 'link']),
  content: z.any(),
  order: z.number(),
});

export const CreateSessionSchema = z.object({
  clientId: z.string(),
  date: z.string().or(z.date()),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  sessionTypeId: z.string(),
  notes: z.string().optional(),
  contentBlocks: z.array(ContentBlockSchema).optional(),
});

export const UpdateSessionSchema = z.object({
  id: z.string(),
  date: z.string().or(z.date()).optional(),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  sessionTypeId: z.string().optional(),
  notes: z.string().optional(),
  contentBlocks: z.array(ContentBlockSchema).optional(),
});

export const ListSessionsSchema = z.object({
  clientId: z.string().optional(),
  billingStatus: BillingStatusSchema.optional(),
  sessionTypeId: z.string().optional(),
  dateRange: z.object({
    start: z.string().or(z.date()),
    end: z.string().or(z.date()),
  }).optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
});

export type BillingStatus = z.infer<typeof BillingStatusSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
export type ListSessionsInput = z.infer<typeof ListSessionsSchema>;


