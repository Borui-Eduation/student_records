import { Timestamp } from './common';

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface InvoiceLineItem {
  sessionId: string;
  serviceDate: Timestamp;
  description: string;
  hours: number;
  hourlyRate: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  userId: string; // Owner of this invoice
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  issueDate: Timestamp;
  billingPeriodStart: Timestamp;
  billingPeriodEnd: Timestamp;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  pdfUrl?: string;
  paidDate?: Timestamp;
  paymentNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}


