import { z } from 'zod';

export const PaginationInputSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
});

export type PaginationInput = z.infer<typeof PaginationInputSchema>;

