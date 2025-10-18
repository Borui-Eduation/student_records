import { Timestamp } from './common';

export interface Rate {
  id: string;
  userId: string; // Owner of this rate
  clientId?: string;
  clientTypeId?: string; // Reference to custom ClientType
  category?: string; // Custom category (e.g., "Tutoring", "Consulting", "Translation")
  amount: number;
  currency: string;
  effectiveDate: Timestamp;
  endDate?: Timestamp;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}


