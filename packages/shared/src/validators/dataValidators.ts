import { z } from 'zod';

/**
 * Runtime Data Validators
 * 
 * These validators use Zod to validate and transform data at runtime,
 * ensuring data consistency and providing safe defaults.
 */

/**
 * Safe string validator - transforms invalid values to default
 */
export const SafeStringSchema = (defaultValue: string = '') =>
  z
    .any()
    .transform((val) => {
      if (typeof val === 'string') return val;
      if (val === null || val === undefined) return defaultValue;
      if (typeof val === 'object') return defaultValue; // Firestore FieldValue
      return String(val);
    });

/**
 * Safe number validator - handles FieldValue objects
 */
export const SafeNumberSchema = (defaultValue: number = 0) =>
  z
    .any()
    .transform((val) => {
      if (typeof val === 'number' && !isNaN(val)) return val;
      // Handle Firestore FieldValue {operand: number}
      if (val && typeof val === 'object' && 'operand' in val) {
        if (typeof val.operand === 'number' && !isNaN(val.operand)) {
          return val.operand;
        }
      }
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) return parsed;
      }
      return defaultValue;
    });

/**
 * Safe array validator
 */
export const SafeArraySchema = <T extends z.ZodTypeAny>(itemSchema: T, defaultValue: z.infer<T>[] = []) =>
  z
    .any()
    .transform((val) => {
      if (Array.isArray(val)) return val;
      if (val === null || val === undefined) return defaultValue;
      return defaultValue;
    });

/**
 * Safe boolean validator
 */
export const SafeBooleanSchema = (defaultValue: boolean = false) =>
  z
    .any()
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      if (val === 'true' || val === 1) return true;
      if (val === 'false' || val === 0) return false;
      return defaultValue;
    });

/**
 * Knowledge Entry runtime validator with safe defaults
 */
export const SafeKnowledgeEntrySchema = z.object({
  id: SafeStringSchema('unknown'),
  userId: SafeStringSchema(''),
  title: SafeStringSchema('[No Title]'),
  type: SafeStringSchema('note'),
  content: SafeStringSchema(''),
  isEncrypted: SafeBooleanSchema(false),
  tags: z.array(z.string()).default([]),
  category: SafeStringSchema('').optional(),
  attachments: z.array(z.string()).default([]),
  accessCount: SafeNumberSchema(0),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  accessedAt: z.any().optional(),
  createdBy: SafeStringSchema(''),
  kmsKeyId: SafeStringSchema('').optional(),
  encryptionMetadata: z.any().optional(),
});

/**
 * User runtime validator with safe defaults
 */
export const SafeUserSchema = z.object({
  id: SafeStringSchema('unknown'),
  email: SafeStringSchema('[No Email]'),
  role: z.enum(['user', 'admin', 'superadmin']).catch('user'),
  createdAt: z.any().optional(),
  lastLoginAt: z.any().optional(),
  isInitialized: SafeBooleanSchema(false),
  isNewUser: SafeBooleanSchema(false).optional(),
  reviewedAt: z.any().optional(),
  reviewedBy: SafeStringSchema('').optional(),
});

/**
 * Validate and sanitize knowledge entry at runtime
 */
export function validateKnowledgeEntry(data: any) {
  return SafeKnowledgeEntrySchema.parse(data);
}

/**
 * Validate and sanitize user at runtime
 */
export function validateUser(data: any) {
  return SafeUserSchema.parse(data);
}



