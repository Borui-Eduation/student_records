import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Timestamp } from '@professional-workspace/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper function to convert Timestamp to Date
 * Handles Firestore Timestamp, Date objects, and string dates robustly
 */
export function toDate(timestamp: Timestamp | null | undefined): Date | null {
  if (!timestamp) {
    return null;
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    // Check if the string was a valid date
    if (isNaN(date.getTime())) {
      console.warn('Failed to parse date string:', timestamp);
      return null;
    }
    return date;
  }
  // For Firestore Timestamp objects that come from the server
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  // Handle cases where a Firestore-like object might have been serialized
  if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp && typeof (timestamp as any)._seconds === 'number') {
    return new Date((timestamp as any)._seconds * 1000);
  }
   if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && typeof (timestamp as any).seconds === 'number') {
    return new Date((timestamp as any).seconds * 1000);
  }

  console.warn('Unable to convert timestamp to Date:', timestamp);
  return null; // Return null if parsing fails
}


