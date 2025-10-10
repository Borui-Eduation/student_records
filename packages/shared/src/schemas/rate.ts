import { z } from 'zod';
import { ClientTypeSchema } from './client';

export const CreateRateSchema = z.object({
  clientId: z.string().optional(),
  clientType: ClientTypeSchema.optional(),
  amount: z.number().positive(),
  currency: z.string().default('CNY'),
  effectiveDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional(),
  description: z.string().max(200).optional(),
});

export const UpdateRateSchema = z.object({
  id: z.string(),
  amount: z.number().positive().optional(),
  endDate: z.string().or(z.date()).optional(),
  description: z.string().max(200).optional(),
});

export type CreateRateInput = z.infer<typeof CreateRateSchema>;
export type UpdateRateInput = z.infer<typeof UpdateRateSchema>;


