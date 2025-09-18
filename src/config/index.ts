import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { existsSync } from 'fs';
import { resolve } from 'path';
import type { ServerConfig } from '../types/index.js';

/* eslint-env node */

export function parseConfig(): ServerConfig {
  const argv = yargs(hideBin(process.argv))
    .option('data-dir', {
      alias: 'd',
      type: 'string',
      demandOption: true,
      description: 'Path to company CRD data directory',
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      default: false,
      description: 'Enable detailed logging',
    })
    .option('port', {
      alias: 'p',
      type: 'number',
      description: 'MCP server port (if applicable)',
    })
    .help()
    .example(
      '$0 --data-dir ./company-crds --verbose',
      'Start server with company CRD data and verbose logging'
    )
    .parseSync();

  const dataDir = resolve(argv['data-dir']);

  // Validate data directory exists
  if (!existsSync(dataDir)) {
    console.error(`❌ Data directory does not exist: ${dataDir}`);
    process.exit(1);
  }

  return {
    dataDir,
    verbose: argv.verbose,
    port: argv.port,
  };
}

export function validateDataDirectory(dataDir: string): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  let valid = true;

  // Check for expected subdirectories
  const expectedDirs = ['crds', 'samples', 'instructions'];
  for (const dir of expectedDirs) {
    const fullPath = resolve(dataDir, dir);
    if (!existsSync(fullPath)) {
      warnings.push(`Missing optional directory: ${dir}`);
    }
  }

  return { valid, warnings, errors };
}
