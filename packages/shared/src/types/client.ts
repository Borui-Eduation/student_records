import { Timestamp } from './common';

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

export interface Client {
  id: string;
  userId: string; // Owner of this client
  name: string;
  clientTypeId?: string; // Reference to custom ClientType
  contactInfo?: ContactInfo;
  billingAddress?: string;
  taxId?: string;
  notes?: string;
  active: boolean;
  defaultRateIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}


