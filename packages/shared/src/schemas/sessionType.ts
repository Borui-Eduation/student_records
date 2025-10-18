import { z } from 'zod';

export const CreateSessionTypeSchema = z.object({
  name: z.string().min(1).max(50).trim(),
});

export const UpdateSessionTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50).trim().optional(),
});

export type CreateSessionTypeInput = z.infer<typeof CreateSessionTypeSchema>;
export type UpdateSessionTypeInput = z.infer<typeof UpdateSessionTypeSchema>;


