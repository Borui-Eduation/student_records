import { z } from 'zod';

export const KnowledgeTypeSchema = z.enum(['note', 'api-key', 'ssh-record', 'password', 'memo']);

export const CreateKnowledgeEntrySchema = z.object({
  title: z.string().min(1).max(200),
  type: KnowledgeTypeSchema,
  content: z.string().max(10000),
  requireEncryption: z.boolean().optional(),
  tags: z.array(z.string().max(30)).max(20).optional(),
  category: z.string().max(50).optional(),
});

export const UpdateKnowledgeEntrySchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(10000).optional(),
  tags: z.array(z.string().max(30)).max(20).optional(),
  category: z.string().max(50).optional(),
});

export const SearchKnowledgeSchema = z.object({
  query: z.string(),
  type: KnowledgeTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
});

export type KnowledgeType = z.infer<typeof KnowledgeTypeSchema>;
export type CreateKnowledgeEntryInput = z.infer<typeof CreateKnowledgeEntrySchema>;
export type UpdateKnowledgeEntryInput = z.infer<typeof UpdateKnowledgeEntrySchema>;
export type SearchKnowledgeInput = z.infer<typeof SearchKnowledgeSchema>;


