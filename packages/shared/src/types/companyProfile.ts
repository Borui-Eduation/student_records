import { Timestamp } from './common';

// Simplified Company Profile - all fields optional for personal/small business use
export interface CompanyProfile {
  id: 'default';
  companyName?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

