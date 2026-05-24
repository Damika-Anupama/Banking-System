/**
 * Error Response Model
 *
 * Defines the structure for error responses throughout the application.
 * This provides type safety and consistent error handling across HTTP requests.
 */

/**
 * Main error response interface
 */
export interface ErrorResponse {
  status: number;
  statusText: string;
  message: string;
  error?: any;
  timestamp?: Date;
  path?: string;
  details?: string[];
}

/**
 * Backend error response format
 * Used when backend sends structured error responses
 */
export interface BackendErrorResponse {
  message?: string;
  error?: string;
  errors?: string[];
  details?: string;
  timestamp?: string;
  path?: string;
  status?: number;
}

/**
 * Error severity levels for logging and display
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error types for categorization
 */
export enum ErrorType {
  HTTP = 'HTTP',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Structured error log format
 */
export interface ErrorLog {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  timestamp: Date;
  userMessage: string;
  technicalDetails?: any;
  stackTrace?: string;
  url?: string;
  statusCode?: number;
}
