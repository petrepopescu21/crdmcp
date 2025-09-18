# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

This is **crdmcp**, a generic Model Context Protocol (MCP) server for Kubernetes Custom Resource Definitions. It enables companies to create an MCP server that loads their CRDs, sample manifests, and documentation, allowing employees to work with Claude Code to manage company-specific infrastructure resources.

## Development Commands

### Build and Run
- `npm run build` - Compile TypeScript to JavaScript
- `npm run server` - Build and start the MCP server (requires `--data-dir` parameter)
- `npm start -- --data-dir ./examples/company-a --verbose` - Start server with example data
- `npm run dev` - Watch mode compilation during development

### Code Quality
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier

**Important**: Always run `npm run lint` after making code changes to ensure code quality and consistency.

**Critical MCP Logging Rule**: Never use `console.log()`, `console.info()`, or `console.warn()` in MCP servers. Only use `console.error()` for all logging output. Writing to stdout corrupts the JSON-RPC protocol communication with Claude Desktop.

### Server Usage
```bash
# Start server with company data
npm run server -- --data-dir /path/to/company/crds --verbose

# Available CLI options:
#   --data-dir, -d: Path to company CRD data directory (required)
#   --verbose, -v: Enable detailed logging
#   --port, -p: MCP server port (optional)
```

## Architecture Overview

### Core Flow
1. **Data Loading**: Server loads CRDs, samples, and instructions from data directory
2. **Tool Registration**: MCP tools are registered for resource discovery and guidance  
3. **MCP Protocol**: Claude Code connects and uses tools to help users create infrastructure
4. **Smart Assistance**: Tools provide contextual suggestions and find related resources

### Key Components

**Data Loading Pipeline** (`src/loaders/`):
- `DataLoader` orchestrates parallel loading of all data types
- `CRDLoader` parses Kubernetes CRD YAML files and extracts metadata
- `SampleLoader` loads sample manifests, categorizes by complexity, extracts tags
- `InstructionLoader` processes markdown files with frontmatter for contextual guidance

**Tool System** (`src/tools/`):
- `BaseTool` provides common functionality (similarity matching, instruction filtering)
- `ToolRegistry` manages tool registration and execution with error handling
- Four main tools: list resources, get details, find samples, get guidance
- Tools use smart matching to find similar resources when exact matches fail

**Type System** (`src/types/`):
- Comprehensive interfaces for CRDs, samples, instructions, and tool results
- Strong typing enables reliable data flow between components

### Data Directory Structure Expected
```
company-data/
├── crds/           # Kubernetes CRD YAML files
├── samples/        # Sample manifest YAML files  
├── instructions/   # Markdown guidance with frontmatter
```

### Resource Categorization
The system automatically categorizes CRDs based on naming patterns:
- `database` - Redis, PostgreSQL, MySQL, MongoDB resources
- `messaging` - Kafka, RabbitMQ, queue resources  
- `service` - API gateways, services, proxies
- `storage` - Storage, volumes, buckets
- `networking` - Network policies, ingress, routes
- `security` - RBAC, policies, certificates

### Tool Execution Pattern
1. Tool receives parameters and validates them
2. Searches loaded data using smart matching algorithms
3. Returns structured results with suggestions for next steps
4. Provides helpful error messages with alternatives when resources not found

## Implementation Notes

### Adding New Tools
1. Extend `BaseTool` class in `src/tools/`
2. Implement `name`, `description`, `inputSchema`, and `execute()` methods
3. Register tool in `ToolRegistry` constructor
4. Use `this.data` to access loaded CRDs, samples, and instructions
5. Return `ToolResult` with success/error status and suggestions

### Data Loading Customization
Each loader supports parallel processing and comprehensive error reporting. Loaders automatically:
- Handle multi-document YAML files
- Extract metadata and generate descriptions
- Apply smart categorization and tagging
- Track file paths for debugging

### Error Handling Pattern
Tools return structured results with:
- Success/failure status
- Data payload or error message  
- Contextual suggestions for next steps
- Metadata for debugging/logging

The MCP server transforms tool results into appropriate MCP responses with formatted suggestions.

### Extending Resource Categories
To add new resource categories, update the `inferResourceCategory()` function in `src/utils/helpers.ts` with new naming patterns.

### Current Status
The core MCP server is functional with resource discovery and guidance tools. Remaining planned features include manifest generation/validation tools and comprehensive testing infrastructure.