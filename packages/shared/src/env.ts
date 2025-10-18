/**
 * Environment Variable Validation
 * Validates and provides type-safe access to environment variables
 */

import { z } from 'zod';

// Server-side environment variables schema
export const serverEnvSchema = z.object({
  // Firebase
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  
  // KMS
  GOOGLE_CLOUD_PROJECT: z.string().min(1).optional(),
  KMS_LOCATION: z.string().default('global'),
  KMS_KEYRING: z.string().default('student-record-keyring'),
  KMS_KEY: z.string().default('sensitive-data-key'),
  
  // Authentication
  ADMIN_EMAILS: z.string().min(1),
  
  // AI Services
  GEMINI_API_KEY: z.string().min(1),
  
  // Server
  PORT: z.string().default('8080'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().min(1),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Client-side environment variables schema
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validates server environment variables
 * Should be called at server startup
 */
export function validateServerEnv(): ServerEnv {
  try {
    return serverEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missing}`);
    }
    throw error;
  }
}

/**
 * Validates client environment variables
 * Should be called in client-side code
 */
export function validateClientEnv(): ClientEnv {
  const clientEnv: Record<string, string | undefined> = {};
  
  // Extract NEXT_PUBLIC_ variables
  for (const key in process.env) {
    if (key.startsWith('NEXT_PUBLIC_')) {
      clientEnv[key] = process.env[key];
    }
  }
  
  try {
    return clientEnvSchema.parse(clientEnv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid client environment variables: ${missing}`);
    }
    throw error;
  }
}

/**
 * Safe environment variable getter with fallback
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  
  return value;
}

