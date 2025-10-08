import { z } from 'zod';

export const BankInfoSchema = z.object({
  bankName: z.string().min(1).max(100),
  accountNumber: z.string().min(1).max(50),
  accountName: z.string().min(1).max(100),
  swiftCode: z.string().max(20).optional(),
});

export const ContactInfoSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  website: z.string().url().optional(),
});

export const UpdateCompanyProfileSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  taxId: z.string().min(1).max(50).optional(),
  address: z.string().min(1).max(500).optional(),
  bankInfo: BankInfoSchema.optional(),
  contactInfo: ContactInfoSchema.optional(),
  logoUrl: z.string().url().optional(),
});

export type BankInfo = z.infer<typeof BankInfoSchema>;
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type UpdateCompanyProfileInput = z.infer<typeof UpdateCompanyProfileSchema>;

