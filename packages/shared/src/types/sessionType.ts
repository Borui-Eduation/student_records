import { Timestamp } from './common';

export interface SessionType {
  id: string;
  userId: string; // Owner of this session type
  name: string; // e.g., "Education", "Technical", "Translation", or custom names
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


