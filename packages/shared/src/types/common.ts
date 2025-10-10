/**
 * Common types used across the application
 */

export type Timestamp = Date | string;

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


