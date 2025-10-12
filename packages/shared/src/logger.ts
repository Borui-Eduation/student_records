/**
 * Unified Logging System
 * Provides structured logging with different levels and context support
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private minLevel: LogLevel;
  private serviceName: string;

  constructor(serviceName: string = 'app', minLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    
    const logObject: Record<string, unknown> = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...(context && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    return JSON.stringify(logObject);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      error,
    };

    const formattedLog = this.formatLog(entry);

    // In development, pretty print; in production, structured JSON
    if (process.env.NODE_ENV === 'development') {
      this.prettyPrint(entry);
    } else {
      // Use appropriate console method for Cloud Logging severity mapping
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedLog);
          break;
        case LogLevel.INFO:
          console.info(formattedLog);
          break;
        case LogLevel.WARN:
          console.warn(formattedLog);
          break;
        case LogLevel.ERROR:
          console.error(formattedLog);
          break;
      }
    }
  }

  private prettyPrint(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      reset: '\x1b[0m',
    };

    const levelColor = colors[entry.level];
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    
    console.log(
      `${levelColor}[${entry.level.toUpperCase()}]${colors.reset} ${timestamp} ${entry.message}`,
      entry.context ? entry.context : '',
      entry.error ? `\n${entry.error.stack}` : ''
    );
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized: LogContext = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'cookie'];

    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, contextOrError?: LogContext | Error, error?: Error): void {
    if (contextOrError instanceof Error) {
      this.log(LogLevel.ERROR, message, undefined, contextOrError);
    } else {
      this.log(LogLevel.ERROR, message, contextOrError, error);
    }
  }

  // Create a child logger with additional context
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger(this.serviceName, this.minLevel);
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevel, message: string, context?: LogContext, error?: Error) => {
      const mergedContext = { ...additionalContext, ...context };
      originalLog(level, message, mergedContext, error);
    };

    return childLogger;
  }
}

// Create default logger instances
export const createLogger = (serviceName: string, minLevel?: LogLevel): Logger => {
  const level = minLevel || (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  return new Logger(serviceName, level);
};

// Default logger
export const logger = createLogger('app');

