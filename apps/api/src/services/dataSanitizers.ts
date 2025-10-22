import * as admin from 'firebase-admin';

/**
 * Data Sanitization Utilities
 * 
 * These utilities ensure all data sent to the frontend is safe and has proper defaults.
 * Handles Firestore FieldValue objects, missing fields, and malformed data.
 */

/**
 * Safely extracts a string value with fallback
 */
export function sanitizeString(value: any, defaultValue: string = ''): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return defaultValue;
  // Handle objects that might be FieldValues
  if (typeof value === 'object') return defaultValue;
  // Convert numbers/booleans to strings if needed
  return String(value);
}

/**
 * Safely extracts a numeric value, handling Firestore FieldValue objects
 * Handles cases where FieldValue.increment objects are serialized as {operand: number}
 */
export function sanitizeNumber(value: any, defaultValue: number = 0): number {
  // Direct number
  if (typeof value === 'number' && !isNaN(value)) return value;
  
  // Firestore FieldValue object {operand: number}
  if (value && typeof value === 'object' && 'operand' in value) {
    if (typeof value.operand === 'number' && !isNaN(value.operand)) {
      return value.operand;
    }
  }
  
  // Try to parse as number
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) return parsed;
  }
  
  return defaultValue;
}

/**
 * Safely extracts an array value with fallback
 */
export function sanitizeArray<T = any>(value: any, defaultValue: T[] = []): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return defaultValue;
  // If it's a single value, wrap it in an array
  if (typeof value !== 'object') return [value as T];
  return defaultValue;
}

/**
 * Safely extracts a boolean value
 */
export function sanitizeBoolean(value: any, defaultValue: boolean = false): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1) return true;
  if (value === 'false' || value === 0) return false;
  return defaultValue;
}

/**
 * Safely converts Firestore Timestamp to ISO string
 */
export function sanitizeTimestamp(value: any): string | undefined {
  if (!value) return undefined;
  
  // Firestore Timestamp
  if (value && typeof value.toDate === 'function') {
    try {
      return value.toDate().toISOString();
    } catch (error) {
      console.error('Failed to convert Timestamp:', error);
      return undefined;
    }
  }
  
  // Already a string (ISO format)
  if (typeof value === 'string') return value;
  
  // Date object
  if (value instanceof Date) {
    try {
      return value.toISOString();
    } catch (error) {
      console.error('Failed to convert Date:', error);
      return undefined;
    }
  }
  
  return undefined;
}

/**
 * Sanitizes a knowledge base entry to ensure all fields are valid
 */
export interface SanitizedKnowledgeEntry {
  id: string;
  userId: string;
  title: string;
  type: string;
  content: string;
  isEncrypted: boolean;
  tags: string[];
  category?: string;
  attachments: string[];
  accessCount: number;
  createdAt?: string;
  updatedAt?: string;
  accessedAt?: string;
  createdBy: string;
  kmsKeyId?: string;
  encryptionMetadata?: any;
}

export function sanitizeKnowledgeEntry(data: any, docId?: string): SanitizedKnowledgeEntry {
  return {
    id: sanitizeString(docId || data.id, 'unknown'),
    userId: sanitizeString(data.userId, ''),
    title: sanitizeString(data.title, '[No Title]'),
    type: sanitizeString(data.type, 'note'),
    content: sanitizeString(data.content, ''),
    isEncrypted: sanitizeBoolean(data.isEncrypted, false),
    tags: sanitizeArray(data.tags, []),
    category: data.category ? sanitizeString(data.category) : undefined,
    attachments: sanitizeArray(data.attachments, []),
    accessCount: sanitizeNumber(data.accessCount, 0),
    createdAt: sanitizeTimestamp(data.createdAt),
    updatedAt: sanitizeTimestamp(data.updatedAt),
    accessedAt: sanitizeTimestamp(data.accessedAt),
    createdBy: sanitizeString(data.createdBy, ''),
    kmsKeyId: data.kmsKeyId ? sanitizeString(data.kmsKeyId) : undefined,
    encryptionMetadata: data.encryptionMetadata || undefined,
  };
}

/**
 * Sanitizes user data to ensure all fields are valid
 */
export interface SanitizedUser {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  createdAt?: string;
  lastLoginAt?: string;
  isInitialized: boolean;
  isNewUser?: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
}

export function sanitizeUser(data: any, docId?: string): SanitizedUser {
  const role = sanitizeString(data.role, 'user');
  const validRole = ['user', 'admin', 'superadmin'].includes(role) ? role : 'user';
  
  return {
    id: sanitizeString(docId || data.id, 'unknown'),
    email: sanitizeString(data.email, '[No Email]'),
    role: validRole as 'user' | 'admin' | 'superadmin',
    createdAt: sanitizeTimestamp(data.createdAt),
    lastLoginAt: sanitizeTimestamp(data.lastLoginAt),
    isInitialized: sanitizeBoolean(data.isInitialized, false),
    isNewUser: data.isNewUser !== undefined ? sanitizeBoolean(data.isNewUser) : undefined,
    reviewedAt: sanitizeTimestamp(data.reviewedAt),
    reviewedBy: data.reviewedBy ? sanitizeString(data.reviewedBy) : undefined,
  };
}

/**
 * Generic object sanitizer - removes undefined values and handles FieldValues
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    
    // Handle FieldValue objects
    if (value && typeof value === 'object' && 'operand' in value) {
      result[key] = sanitizeNumber(value);
    } else if (Array.isArray(value)) {
      result[key] = sanitizeArray(value);
    } else if (value && typeof value.toDate === 'function') {
      result[key] = sanitizeTimestamp(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

