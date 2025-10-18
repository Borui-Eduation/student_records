import { Timestamp } from './common';

export type BillingStatus = 'unbilled' | 'billed' | 'paid';
export type BlockType = 'heading' | 'paragraph' | 'bulletList' | 'orderedList' | 'codeBlock' | 'image' | 'link';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: any;
  order: number;
}

export interface Session {
  id: string;
  userId: string; // Owner of this session
  clientId: string;
  clientName: string;
  clientTypeId?: string; // Reference to ClientType (from client, for optimized rate lookup)
  date: Timestamp;
  startTime: string;
  endTime: string;
  durationHours: number;
  sessionTypeId: string; // Reference to custom SessionType
  rateId: string;
  rateAmount: number;
  totalAmount: number;
  currency: string;
  billingStatus: BillingStatus;
  invoiceId?: string;
  contentBlocks: ContentBlock[];
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}


