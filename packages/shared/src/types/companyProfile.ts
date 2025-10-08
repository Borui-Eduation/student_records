import { Timestamp } from './common';

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  swiftCode?: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  website?: string;
}

export interface CompanyProfile {
  id: 'default';
  companyName: string;
  taxId: string;
  address: string;
  bankInfo: BankInfo;
  contactInfo: ContactInfo;
  logoUrl?: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

