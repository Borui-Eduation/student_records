import { z } from 'zod';

export const CreateClientTypeSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export const UpdateClientTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50).trim().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export type CreateClientTypeInput = z.infer<typeof CreateClientTypeSchema>;
export type UpdateClientTypeInput = z.infer<typeof UpdateClientTypeSchema>;


