import { Timestamp } from './common';

// Simplified Company Profile - all fields optional for personal/small business use
// Each user has their own company profile (document ID is userId)
export interface CompanyProfile {
  id: string; // User ID
  companyName?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

