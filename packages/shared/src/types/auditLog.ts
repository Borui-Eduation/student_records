import { Timestamp } from './common';

export type AuditAction =
  | 'ACCESS_SENSITIVE'
  | 'DECRYPT_KEY'
  | 'CREATE_SHARING_LINK'
  | 'REVOKE_SHARING_LINK'
  | 'GENERATE_INVOICE'
  | 'EXPORT_SESSION'
  | 'DELETE_RECORDING'
  | 'UPDATE_COMPANY_PROFILE';

export interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
}

