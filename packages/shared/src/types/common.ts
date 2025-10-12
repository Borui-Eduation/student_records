/**
 * Common types used across the application
 */

// Firestore Timestamp with toDate method
export interface FirestoreTimestamp {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

export type Timestamp = Date | string | FirestoreTimestamp;

export interface PaginationInput {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}


