import { Timestamp } from './common';

export type ClientType = 'institution' | 'individual' | 'project';

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

export interface Client {
  id: string;
  name: string;
  type: ClientType;
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

