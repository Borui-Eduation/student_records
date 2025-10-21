/**
 * Central type definitions for the web application
 * Re-exports types from shared package and adds frontend-specific types
 */

// Re-export all types from shared package
export type {
  Client,
  ClientType,
  ContactInfo,
  Rate,
  Session,
  Invoice,
  InvoiceStatus,
  KnowledgeEntry,
  SharingLink,
  CompanyProfile,
  AuditLog,
  Expense,
  ExpenseCategory,
  PresetCategory,
} from '@professional-workspace/shared';

// Frontend-specific types

/**
 * Generic dialog props for entity dialogs
 */
export interface EntityDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: T | null;
}

/**
 * Generic table action handlers
 */
export interface TableActionHandlers<T> {
  onEdit?: (entity: T) => void;
  onDelete?: (entity: T) => void;
  onView?: (entity: T) => void;
}

/**
 * Form submission states
 */
export interface FormState {
  isSubmitting: boolean;
  error?: string | null;
  success?: boolean;
}

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Sort state
 */
export interface SortState<T = string> {
  field: T;
  direction: 'asc' | 'desc';
}

/**
 * Filter state
 */
export interface FilterState {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Revenue analytics types
 */
export interface ClientRevenueData {
  clientId: string;
  clientName: string;
  revenue: number;
  hours: number;
  sessionCount: number;
}

export interface CategoryBreakdownData {
  category: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

