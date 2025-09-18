import { existsSync } from 'fs';
import { resolve } from 'path';
import { watch } from 'chokidar';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { DataLoader } from '../../loaders/index.js';
import { ToolRegistry } from '../../tools/index.js';
import { Logger } from '../../utils/logger.js';
import type { ServerConfig } from '../../types/index.js';

interface StartOptions {
  'data-dir': string;
  verbose?: boolean;
  port?: number;
  watch?: boolean;
}

export async function startServer(argv: StartOptions) {
  const logger = new Logger(argv.verbose);

  try {
    const dataDir = resolve(argv['data-dir']);

    // Validate data directory exists
    if (!existsSync(dataDir)) {
      logger.error(`Data directory does not exist: ${dataDir}`);
      process.exit(1);
    }

    const config: ServerConfig = {
      dataDir,
      verbose: argv.verbose || false,
      port: argv.port,
    };

    logger.info('🚀 Starting Generic CRD MCP Server...');
    logger.debug(`Configuration: ${JSON.stringify(config, null, 2)}`);

    // Initial data load
    let server: McpServer;
    let transport: StdioServerTransport;

    const loadDataAndStartServer = async () => {
      logger.info('📊 Loading CRD data...');

      // Load all data
      const dataLoader = new DataLoader(config);
      const loadedData = await dataLoader.loadAllData();

      // Initialize tool registry
      const toolRegistry = new ToolRegistry(loadedData);
      const tools = toolRegistry.getToolDefinitions();

      logger.success(`🔧 Registered ${tools.length} tools`);
      if (argv.verbose) {
        tools.forEach((tool) => {
          logger.debug(`   - ${tool.name}: ${tool.description}`);
        });
      }

      // Create new MCP server instance
      if (server) {
        // If server already exists, we're reloading
        logger.info('🔄 Reloading server with updated data...');
      }

      server = new McpServer({
        name: 'crd-mcp-server',
        version: '1.0.0',
      });

      // Register all tools with the MCP server
      for (const toolDef of tools) {
        server.registerTool(
          toolDef.name,
          {
            title: toolDef.name,
            description: toolDef.description,
            inputSchema: toolDef.inputSchema,
          },
          async (args: any) => {
            try {
              logger.debug(`Executing tool: ${toolDef.name} with args:`, args);
              const result = await toolRegistry.executeTool(toolDef.name, args);
              logger.debug(`Tool ${toolDef.name} result:`, result);
              return result;
            } catch (error) {
              logger.error(`Tool execution error for ${toolDef.name}:`, error);
              throw error;
            }
          }
        );
      }

      return { server, dataLoader: dataLoader };
    };

    // Initial load
    const { server: initialServer } = await loadDataAndStartServer();
    server = initialServer;

    // Set up file watching if requested
    if (argv.watch) {
      logger.info(`👀 Watching ${dataDir} for changes...`);

      const watcher = watch(dataDir, {
        persistent: true,
        ignoreInitial: true,
        depth: 10, // Watch subdirectories
      });

      watcher.on('change', async (path) => {
        logger.info(`📝 File changed: ${path}`);
        try {
          await loadDataAndStartServer();
          logger.success('✅ Server reloaded successfully');
        } catch (error) {
          logger.error('❌ Failed to reload server:', error);
        }
      });

      watcher.on('add', async (path) => {
        logger.info(`➕ File added: ${path}`);
        try {
          await loadDataAndStartServer();
          logger.success('✅ Server reloaded successfully');
        } catch (error) {
          logger.error('❌ Failed to reload server:', error);
        }
      });

      watcher.on('unlink', async (path) => {
        logger.info(`➖ File removed: ${path}`);
        try {
          await loadDataAndStartServer();
          logger.success('✅ Server reloaded successfully');
        } catch (error) {
          logger.error('❌ Failed to reload server:', error);
        }
      });

      // Graceful shutdown
      process.on('SIGINT', () => {
        logger.info('🛑 Stopping server...');
        watcher.close();
        process.exit(0);
      });
    }

    // Start the MCP server
    transport = new StdioServerTransport();
    await server.connect(transport);

    logger.success('🎉 MCP Server started successfully!');
    logger.info('💡 Server is now listening for MCP requests via stdio');

    if (argv.watch) {
      logger.info('🔄 File watching enabled - server will reload on changes');
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}
