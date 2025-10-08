import { Timestamp } from './common';

export type SessionType = 'education' | 'technical';
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
  clientId: string;
  clientName: string;
  date: Timestamp;
  startTime: string;
  endTime: string;
  durationHours: number;
  sessionType: SessionType;
  rateId: string;
  rateAmount: number;
  totalAmount: number;
  currency: string;
  billingStatus: BillingStatus;
  invoiceId?: string;
  contentBlocks: ContentBlock[];
  whiteboardUrls: string[];
  audioUrls: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

