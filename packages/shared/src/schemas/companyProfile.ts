import { z } from 'zod';

// Simplified Company Profile - all fields optional for personal/small business use
export const UpdateCompanyProfileSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  address: z.string().min(1).max(500).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
});

export type UpdateCompanyProfileInput = z.infer<typeof UpdateCompanyProfileSchema>;

