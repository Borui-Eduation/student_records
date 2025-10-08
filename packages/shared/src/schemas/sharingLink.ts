import { z } from 'zod';

export const CreateSharingLinkSchema = z.object({
  sessionId: z.string(),
  expiresInDays: z.number().positive().optional().default(90),
});

export type CreateSharingLinkInput = z.infer<typeof CreateSharingLinkSchema>;

