/**
 * Frontend Type Guards and Validation Utilities
 * 
 * These utilities provide defensive checks for data received from the backend,
 * ensuring safe rendering and preventing React errors from malformed data.
 */

import type { KnowledgeEntry } from '@professional-workspace/shared';

/**
 * Validates if a value is a valid string (not an object that would cause React errors)
 */
export function isValidString(value: any): value is string {
  if (typeof value === 'string') return true;
  if (value === null || value === undefined) return false;
  // Check for Firestore FieldValue objects that shouldn't be rendered
  if (typeof value === 'object') return false;
  return false;
}

/**
 * Validates if a value is a valid number
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Validates if a value is a valid array
 */
export function isValidArray(value: any): value is any[] {
  return Array.isArray(value);
}

/**
 * Safely extracts a string value with fallback
 */
export function safeString(value: any, fallback: string = ''): string {
  if (isValidString(value)) return value;
  return fallback;
}

/**
 * Safely extracts a number value with fallback
 */
export function safeNumber(value: any, fallback: number = 0): number {
  if (isValidNumber(value)) return value;
  // Handle Firestore FieldValue objects
  if (value && typeof value === 'object' && 'operand' in value) {
    if (isValidNumber(value.operand)) return value.operand;
  }
  return fallback;
}

/**
 * Safely extracts an array value with fallback
 */
export function safeArray<T = any>(value: any, fallback: T[] = []): T[] {
  if (isValidArray(value)) return value;
  return fallback;
}

/**
 * Validates if a knowledge entry has all required fields for safe rendering
 */
export function isValidKnowledgeEntry(entry: any): entry is KnowledgeEntry {
  if (!entry || typeof entry !== 'object') return false;
  
  // Check required string fields
  if (!isValidString(entry.id)) return false;
  if (!isValidString(entry.title)) return false;
  if (!isValidString(entry.type)) return false;
  
  return true;
}

/**
 * Validates if a user object has all required fields for safe rendering
 */
export function isValidUser(user: any): boolean {
  if (!user || typeof user !== 'object') return false;
  
  // Check required fields
  if (!isValidString(user.id)) return false;
  if (!isValidString(user.email)) return false;
  if (!isValidString(user.role)) return false;
  
  return true;
}

/**
 * Generic field validator - checks if object has specific valid fields
 */
export function hasValidFields(obj: any, fields: string[]): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  for (const field of fields) {
    const value = obj[field];
    
    // Allow undefined for optional fields, but not invalid objects
    if (value === undefined) continue;
    
    // Check if it's a valid primitive value
    if (typeof value === 'string') continue;
    if (typeof value === 'number' && !isNaN(value)) continue;
    if (typeof value === 'boolean') continue;
    if (value === null) continue;
    if (Array.isArray(value)) continue;
    
    // If it's an object with special properties (like Firestore FieldValue), it's invalid
    if (typeof value === 'object' && ('operand' in value || '_methodName' in value)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Sanitizes a knowledge entry for safe rendering
 */
export function sanitizeKnowledgeEntryForDisplay(entry: any): KnowledgeEntry {
  return {
    id: safeString(entry?.id, 'unknown'),
    userId: safeString(entry?.userId, ''),
    title: safeString(entry?.title, '[No Title]'),
    type: safeString(entry?.type, 'note') as any,
    content: safeString(entry?.content, ''),
    isEncrypted: Boolean(entry?.isEncrypted),
    tags: safeArray(entry?.tags, []),
    category: entry?.category ? safeString(entry.category) : undefined,
    attachments: safeArray(entry?.attachments, []),
    accessCount: safeNumber(entry?.accessCount, 0),
    createdAt: entry?.createdAt || undefined,
    updatedAt: entry?.updatedAt || undefined,
    accessedAt: entry?.accessedAt || undefined,
    createdBy: safeString(entry?.createdBy, ''),
    kmsKeyId: entry?.kmsKeyId ? safeString(entry.kmsKeyId) : undefined,
    encryptionMetadata: entry?.encryptionMetadata || undefined,
  };
}

/**
 * Sanitizes a user object for safe rendering
 */
export function sanitizeUserForDisplay(user: any): any {
  return {
    id: safeString(user?.id, 'unknown'),
    email: safeString(user?.email, '[No Email]'),
    role: safeString(user?.role, 'user'),
    createdAt: user?.createdAt || undefined,
    lastLoginAt: user?.lastLoginAt || undefined,
    isInitialized: Boolean(user?.isInitialized),
    isNewUser: user?.isNewUser !== undefined ? Boolean(user.isNewUser) : undefined,
    reviewedAt: user?.reviewedAt || undefined,
    reviewedBy: user?.reviewedBy ? safeString(user.reviewedBy) : undefined,
  };
}

/**
 * Checks if a value can be safely rendered as a React child
 */
export function isSafeReactChild(value: any): boolean {
  // Primitives are safe
  if (typeof value === 'string') return true;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  if (value === null || value === undefined) return true;
  
  // Arrays need to be checked recursively
  if (Array.isArray(value)) {
    return value.every(isSafeReactChild);
  }
  
  // Objects (including FieldValues) are NOT safe
  if (typeof value === 'object') return false;
  
  return false;
}

/**
 * Makes a value safe for React rendering by converting objects to strings
 */
export function makeSafeForReact(value: any, fallback: string = ''): string | number | boolean | null {
  if (isSafeReactChild(value)) return value;
  
  // Convert objects to safe representation
  if (typeof value === 'object') {
    if ('operand' in value && typeof value.operand === 'number') {
      return value.operand;
    }
    return fallback;
  }
  
  return fallback;
}




