/* eslint-env node */

export class Logger {
  constructor(private verbose: boolean = false) {}

  info(message: string, ...args: any[]): void {
    console.error(`ℹ️  ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.error(`⚠️  ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`❌ ${message}`, ...args);
  }

  success(message: string, ...args: any[]): void {
    console.error(`✅ ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.verbose) {
      console.error(`🔍 ${message}`, ...args);
    }
  }

  timing(label: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.debug(`${label} completed in ${duration}ms`);
  }
}

export function createLogger(verbose: boolean = false): Logger {
  return new Logger(verbose);
}
