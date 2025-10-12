// Export all schemas (includes types via Zod inference)
export * from './schemas';

// Export types that are not in schemas
export type {
  Client,
  Rate,
  Session,
  Invoice,
  KnowledgeEntry,
  SharingLink,
  CompanyProfile,
  AuditLog,
  Expense,
  ExpenseStatistics,
  ExpenseCategoryType,
  PaymentMethod,
  Timestamp,
  ContentBlock,
  ClientType,
  KnowledgeType,
  SessionType,
} from './types';

// Export expense category utilities
export { PRESET_CATEGORIES } from './types/expenseCategory';
export type { PresetCategory, ExpenseCategory } from './types/expenseCategory';

// Export utilities
export * from './logger';
export * from './env';

// Re-export commonly used utilities
export { z } from 'zod';

