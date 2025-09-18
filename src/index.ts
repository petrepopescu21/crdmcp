import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { parseConfig } from './config/index.js';
import { DataLoader } from './loaders/index.js';
import { ToolRegistry } from './tools/index.js';
import { Logger } from './utils/logger.js';

async function main() {
  let logger: Logger;

  try {
    // Parse configuration from command line
    const config = parseConfig();
    logger = new Logger(config.verbose);

    logger.info('🚀 Starting Generic CRD MCP Server...');
    logger.debug(`Configuration: ${JSON.stringify(config, null, 2)}`);

    // Load all data
    const dataLoader = new DataLoader(config);
    const loadedData = await dataLoader.loadAllData();

    // Initialize tool registry
    const toolRegistry = new ToolRegistry(loadedData);
    const tools = toolRegistry.getToolDefinitions();

    logger.success(`🔧 Registered ${tools.length} tools`);
    tools.forEach((tool) => {
      logger.debug(`   - ${tool.name}: ${tool.description}`);
    });

    // Create MCP server
    const server = new McpServer({
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
          logger.error(`🔧 Executing tool: ${toolDef.name} with args:`, JSON.stringify(args, null, 2));
          const startTime = Date.now();

          try {
            const result = await toolRegistry.executeTool(toolDef.name, args);
            logger.timing(`Tool ${toolDef.name}`, startTime);
            logger.error(`🔧 Tool ${toolDef.name} result:`, { success: result.success, hasData: !!result.data, error: result.error });

            if (result.success) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: JSON.stringify(result.data, null, 2),
                  },
                ],
              };
            } else {
              logger.error(`🔧 Tool ${toolDef.name} returned error: ${result.error}`);
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: `Error: ${result.error}${
                      result.suggestions
                        ? '\n\nSuggestions:\n' +
                          result.suggestions
                            .map((s: string) => `• ${s}`)
                            .join('\n')
                        : ''
                    }`,
                  },
                ],
              };
            }
          } catch (error) {
            logger.error(`🔧 Tool ${toolDef.name} threw exception:`, error);
            logger.error(`🔧 Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Internal error executing ${toolDef.name}: ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                },
              ],
            };
          }
        }
      );
    }

    // Add a server status resource
    server.registerResource(
      'server-status',
      new ResourceTemplate('crd-server://status', { list: undefined }),
      {
        title: 'Server Status',
        description: 'Current server status and statistics',
      },
      async () => ({
        contents: [
          {
            uri: 'crd-server://status',
            text: JSON.stringify(
              {
                status: 'running',
                dataDirectory: config.dataDir,
                statistics: loadedData.statistics,
                availableTools: tools.map((t) => t.name),
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      })
    );

    logger.success('✅ Server initialization completed');
    logger.error('📡 Starting MCP transport...');
    logger.error('📡 Waiting for MCP client connection...');

    // Start the server
    const transport = new StdioServerTransport();
    
    // Add connection event handlers for debugging
    transport.onclose = () => {
      logger.error('🔌 MCP transport connection closed');
    };
    
    transport.onerror = (error: any) => {
      logger.error('🔌 MCP transport error:', error);
    };

    await server.connect(transport);

    logger.success('🎉 CRD MCP Server is ready and connected!');
  } catch (error) {
    // logger might not be initialized if parseConfig fails
    const errorLogger = logger! || new Logger(true);
    errorLogger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\n👋 Shutting down CRD MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\n👋 Shutting down CRD MCP Server...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
