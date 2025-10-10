import { Timestamp } from './common';
import { ClientType } from './client';

export interface Rate {
  id: string;
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


