import { Timestamp } from './common';

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  id: string; // Firebase UID
  email: string;
  role: UserRole;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  isInitialized: boolean; // Track if welcome guide created
}

