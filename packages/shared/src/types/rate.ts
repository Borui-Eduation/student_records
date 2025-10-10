import { Timestamp } from './common';
import { ClientType } from './client';

export interface Rate {
  id: string;
  userId: string; // Owner of this rate
  clientId?: string;
  clientType?: ClientType;
  amount: number;
  currency: string;
  effectiveDate: Timestamp;
  endDate?: Timestamp;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}


