/* eslint-env node */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export interface LoggerConfig {
  level: LogLevel;
  verbose: boolean;
  showTimestamps: boolean;
  showContext: boolean;
  useColors: boolean;
}

export interface ProgressIndicator {
  update(current: number, total: number, message?: string): void;
  complete(message?: string): void;
  fail(message?: string): void;
}

class SimpleProgressIndicator implements ProgressIndicator {
  private logger: Logger;
  private startTime: number;

  constructor(
    logger: Logger,
    private label: string
  ) {
    this.logger = logger;
    this.startTime = Date.now();
  }

  update(current: number, total: number, message?: string): void {
    const percentage = Math.round((current / total) * 100);
    const progressMessage = message
      ? `${this.label}: ${message} (${percentage}%)`
      : `${this.label}: ${percentage}%`;
    this.logger.debug(progressMessage);
  }

  complete(message?: string): void {
    const duration = Date.now() - this.startTime;
    const completeMessage = message
      ? `${this.label}: ${message} (${duration}ms)`
      : `${this.label} completed in ${duration}ms`;
    this.logger.success(completeMessage);
  }

  fail(message?: string): void {
    const duration = Date.now() - this.startTime;
    const failMessage = message
      ? `${this.label}: ${message} (${duration}ms)`
      : `${this.label} failed after ${duration}ms`;
    this.logger.error(failMessage);
  }
}

export class Logger {
  private config: LoggerConfig;
  private context: string[];

  constructor(verbose: boolean = false, config?: Partial<LoggerConfig>) {
    this.config = {
      level: verbose ? LogLevel.DEBUG : LogLevel.INFO,
      verbose,
      showTimestamps: false,
      showContext: verbose,
      useColors: true,
      ...config,
    };
    this.context = [];
  }

  withContext(context: string): Logger {
    const newLogger = new Logger(this.config.verbose, this.config);
    newLogger.context = [...this.context, context];
    return newLogger;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    emoji: string
  ): string {
    let formattedMessage = '';

    if (this.config.showTimestamps) {
      formattedMessage += `[${new Date().toISOString()}] `;
    }

    if (this.config.showContext && this.context.length > 0) {
      formattedMessage += `[${this.context.join(':')}] `;
    }

    formattedMessage += `${emoji} ${message}`;
    return formattedMessage;
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.error(this.formatMessage(LogLevel.INFO, message, 'ℹ️'), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.error(this.formatMessage(LogLevel.WARN, message, '⚠️'), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, '❌'), ...args);

      // Include stack trace for errors in debug mode
      if (this.config.level >= LogLevel.DEBUG && args.length > 0) {
        const errorArg = args.find((arg) => arg instanceof Error);
        if (errorArg instanceof Error && errorArg.stack) {
          console.error('Stack trace:', errorArg.stack);
        }
      }
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.error(this.formatMessage(LogLevel.INFO, message, '✅'), ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.error(this.formatMessage(LogLevel.DEBUG, message, '🔍'), ...args);
    }
  }

  trace(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.TRACE)) {
      console.error(this.formatMessage(LogLevel.TRACE, message, '🔎'), ...args);
    }
  }

  timing(label: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.debug(`${label} completed in ${duration}ms`);
  }

  startProgress(label: string): ProgressIndicator {
    return new SimpleProgressIndicator(this, label);
  }

  group<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    this.debug(`Starting: ${label}`);
    const result = fn();

    if (result instanceof Promise) {
      return result
        .then((value) => {
          this.debug(`Completed: ${label}`);
          return value;
        })
        .catch((error) => {
          this.error(`Failed: ${label}`, error);
          throw error;
        });
    } else {
      this.debug(`Completed: ${label}`);
      return result;
    }
  }

  // Utility methods for common patterns
  logLoadingStats(type: string, count: number, duration: number): void {
    this.info(`Loaded ${count} ${type}${count !== 1 ? 's' : ''}`);
    if (this.config.verbose) {
      this.debug(`${type} loading completed in ${duration}ms`);
    }
  }

  logValidationResult(
    type: string,
    errors: string[],
    warnings: string[],
    strict: boolean = false
  ): void {
    if (errors.length > 0) {
      this.error(`${type} validation errors:`);
      errors.forEach((error) => this.error(`   • ${error}`));
    }

    if (warnings.length > 0) {
      if (strict) {
        this.error(`${type} validation warnings (strict mode):`);
        warnings.forEach((warning) => this.error(`   • ${warning}`));
      } else {
        this.warn(`${type} validation warnings:`);
        warnings.forEach((warning) => this.warn(`   • ${warning}`));
      }
    }

    if (errors.length === 0 && warnings.length === 0) {
      this.success(`${type} validation passed`);
    }
  }

  logPerformanceMetrics(metrics: Record<string, number>): void {
    this.debug('Performance metrics:');
    Object.entries(metrics).forEach(([key, value]) => {
      this.debug(`   ${key}: ${value}ms`);
    });
  }
}

export function createLogger(
  verbose: boolean = false,
  config?: Partial<LoggerConfig>
): Logger {
  return new Logger(verbose, config);
}
