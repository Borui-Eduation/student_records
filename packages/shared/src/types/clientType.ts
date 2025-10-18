import { Timestamp } from './common';

export interface ClientType {
  id: string;
  userId: string; // Owner of this client type
  name: string; // e.g., "Institution", "Individual", "Project", or custom names
  color?: string; // Optional hex color for UI display
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

