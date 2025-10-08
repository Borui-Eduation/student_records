import { z } from 'zod';

export const InvoiceStatusSchema = z.enum(['draft', 'sent', 'paid']);

export const GenerateInvoiceSchema = z.object({
  clientId: z.string(),
  sessionIds: z.array(z.string()).min(1),
  notes: z.string().optional(),
});

export const UpdateInvoiceStatusSchema = z.object({
  id: z.string(),
  status: InvoiceStatusSchema,
  paidDate: z.string().or(z.date()).optional(),
  paymentNotes: z.string().optional(),
});

export const GetRevenueReportSchema = z.object({
  dateRange: z.object({
    start: z.string().or(z.date()),
    end: z.string().or(z.date()),
  }),
  clientId: z.string().optional(),
  sessionType: z.enum(['education', 'technical']).optional(),
});

export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof UpdateInvoiceStatusSchema>;
export type GetRevenueReportInput = z.infer<typeof GetRevenueReportSchema>;

