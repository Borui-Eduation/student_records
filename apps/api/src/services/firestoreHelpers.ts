/**
 * Firestore Helper Functions
 * Utilities for safely handling Firestore operations and data cleaning
 */

/**
 * Recursively removes undefined values from an object
 * This is needed because Firestore cannot store undefined values
 * @param obj - The object to clean
 * @returns A new object with undefined values removed
 */
export function cleanUndefinedValues<T extends Record<string, any>>(obj: T): Partial<T> {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => 
      item !== null && typeof item === 'object' 
        ? cleanUndefinedValues(item) 
        : item
    ) as any;
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      const value = obj[key];
      if (value !== undefined) {
        if (value !== null && typeof value === 'object') {
          cleaned[key] = cleanUndefinedValues(value);
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Adds a where clause only if the value is not undefined/null
 * This prevents "undefined is not a valid query constraint" errors
 * @param query - The Firestore query
 * @param field - The field name
 * @param operator - The comparison operator
 * @param value - The value to compare (will only add clause if defined and not null)
 * @returns The original query or a new query with the where clause added
 */
export function addConditionalWhere(
  query: any,
  field: string,
  operator: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any',
  value: any
): any {
  // Only add where clause if value is defined and not null
  if (value !== undefined && value !== null) {
    return query.where(field, operator, value);
  }
  return query;
}
