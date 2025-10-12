import { Timestamp } from './common';

export interface SharingLink {
  id: string;
  userId: string; // Owner of this sharing link
  token: string;
  sessionId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  revoked: boolean;
  accessCount: number;
  lastAccessedAt?: Timestamp;
  createdBy: string;
  url?: string; // Computed field, not stored in DB
  sessionClientName?: string; // Included when fetching lists
  sessionDate?: Timestamp; // Included when fetching lists
}


