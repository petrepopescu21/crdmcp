#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startServer } from './commands/start.js';
import { validateCommand } from './commands/validate.js';
import { infoCommand } from './commands/info.js';
import { generateCommand } from './commands/generate.js';

export async function main() {
  await yargs(hideBin(process.argv))
    .scriptName('crdmcp')
    .usage('$0 <command> [options]')
    .command(
      'start [data-dir]',
      'Start the MCP server',
      {
        'data-dir': {
          describe: 'Path to company CRD data directory',
          type: 'string',
          demandOption: true,
        },
        verbose: {
          alias: 'v',
          type: 'boolean',
          default: false,
          description: 'Enable detailed logging',
        },
        port: {
          alias: 'p',
          type: 'number',
          description: 'MCP server port (if applicable)',
        },
        watch: {
          alias: 'w',
          type: 'boolean',
          default: false,
          description: 'Watch data directory for changes and reload',
        },
      },
      startServer as any
    )
    .command(
      'validate [data-dir]',
      'Validate CRD data directory structure and content',
      {
        'data-dir': {
          describe: 'Path to company CRD data directory',
          type: 'string',
          demandOption: true,
        },
        verbose: {
          alias: 'v',
          type: 'boolean',
          default: false,
          description: 'Enable detailed validation output',
        },
        strict: {
          alias: 's',
          type: 'boolean',
          default: false,
          description: 'Enable strict validation (warnings become errors)',
        },
      },
      validateCommand as any
    )
    .command(
      'info [data-dir]',
      'Show information about CRD data directory',
      {
        'data-dir': {
          describe: 'Path to company CRD data directory',
          type: 'string',
          demandOption: true,
        },
        format: {
          alias: 'f',
          type: 'string',
          choices: ['table', 'json', 'yaml'],
          default: 'table',
          description: 'Output format',
        },
        verbose: {
          alias: 'v',
          type: 'boolean',
          default: false,
          description: 'Show detailed information',
        },
      },
      infoCommand as any
    )
    .command(
      'generate <type>',
      'Generate example data structures',
      {
        type: {
          describe: 'Type of structure to generate',
          type: 'string',
          choices: ['company-structure', 'sample-crd', 'sample-manifest', 'instruction'],
        },
        output: {
          alias: 'o',
          type: 'string',
          description: 'Output directory',
          default: './generated',
        },
        name: {
          alias: 'n',
          type: 'string',
          description: 'Name for generated resources',
        },
        force: {
          type: 'boolean',
          default: false,
          description: 'Overwrite existing files',
        },
      },
      generateCommand as any
    )
    .demandCommand(1, 'You must specify a command')
    .help()
    .alias('h', 'help')
    .version()
    .alias('V', 'version')
    .completion()
    .strict()
    .parseAsync();
}

// Always run the main function when this file is executed
main().catch((error) => {
  console.error('❌ CLI Error:', error.message);
  process.exit(1);
});