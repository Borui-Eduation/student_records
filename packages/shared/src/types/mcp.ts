/**
 * Model Context Protocol (MCP) Types
 * Defines the structure for AI-powered database operations
 */

// Operation types supported by the MCP system
export type MCPOperation = 'create' | 'read' | 'update' | 'delete' | 'search' | 'aggregate';

// Aggregation function types
export type MCPAggregateFunction = 'sum' | 'count' | 'avg' | 'min' | 'max';

// Entity types that can be operated on
export type MCPEntity = 
  | 'client' 
  | 'session' 
  | 'rate' 
  | 'invoice' 
  | 'sessionType' 
  | 'clientType'
  | 'expense'
  | 'expenseCategory'
  | 'knowledgeBase';

// Main command structure parsed from natural language
export interface MCPCommand {
  operation: MCPOperation;
  entity: MCPEntity;
  data?: Record<string, any>;
  conditions?: Record<string, any>;
  // For aggregate operations
  aggregations?: {
    function: MCPAggregateFunction;
    field: string; // Field to aggregate on (e.g., 'totalAmount')
  }[];
  metadata?: {
    confidence?: number; // AI confidence score (0-1)
    originalInput?: string; // Original user input
    warnings?: string[]; // Any warnings about the operation
  };
}

// Multi-step command for complex operations
export interface MCPWorkflow {
  commands: MCPCommand[];
  description: string; // Human-readable description of what will happen
  requiresConfirmation: boolean;
}

// Result of AI parsing
export interface MCPParseResult {
  success: boolean;
  workflow?: MCPWorkflow;
  error?: string;
  suggestions?: string[]; // Suggestions if parsing failed
}

// Result of command execution
export interface MCPExecutionResult {
  success: boolean;
  data?: any; // The created/updated/retrieved data
  error?: string;
  naturalResponse?: string; // Natural language response for aggregate queries
  affectedRecords?: {
    entity: MCPEntity;
    id: string;
    operation: MCPOperation;
  }[];
}

// History entry for tracking AI operations
export interface MCPHistoryEntry {
  id: string;
  userId: string;
  timestamp: string;
  input: string;
  workflow: MCPWorkflow;
  result: MCPExecutionResult;
  executionTimeMs: number;
}

// Context for maintaining conversation state
export interface MCPContext {
  recentCommands: MCPHistoryEntry[];
  currentDate: string; // For relative time parsing
  userPreferences?: {
    defaultCurrency?: string;
    timezone?: string;
  };
}

