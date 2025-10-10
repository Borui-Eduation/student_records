import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['user', 'superadmin']),
  isInitialized: z.boolean(),
});

export const GetCurrentUserSchema = z.object({});

export type GetCurrentUserInput = z.infer<typeof GetCurrentUserSchema>;

