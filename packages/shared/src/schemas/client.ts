import { z } from 'zod';

export const ContactInfoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  address: z.string().max(500).optional(),
});

export const CreateClientSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  clientTypeId: z.string().optional(),
  contactInfo: ContactInfoSchema.optional(),
  billingAddress: z.string().max(500).optional(),
  taxId: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateClientSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).trim().optional(),
  clientTypeId: z.string().optional(),
  contactInfo: ContactInfoSchema.optional(),
  billingAddress: z.string().max(500).optional(),
  taxId: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const ListClientsSchema = z.object({
  clientTypeId: z.string().optional(),
  active: z.boolean().optional().default(true),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
});

export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type ListClientsInput = z.infer<typeof ListClientsSchema>;


