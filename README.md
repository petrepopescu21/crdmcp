# CRD MCP Server

A comprehensive Model Context Protocol (MCP) server for Kubernetes Custom Resource Definitions (CRDs). This server allows organizations to load their own CRDs, sample manifests, and custom instructions to enable AI-assisted infrastructure management.

## Features

- 🔍 **CRD Discovery**: Load and explore custom Kubernetes resources
- 📝 **Sample Manifests**: Access example configurations for each resource type
- 📚 **Instruction Documents**: Company-specific guidance and best practices
- 🤖 **MCP Integration**: Works with Claude and other MCP-compatible AI tools
- 🖥️ **Command Line Interface**: Comprehensive CLI for validation, info, and generation
- 📊 **Advanced Logging**: Contextual logging with progress indicators and performance metrics
- ✅ **Full Testing**: Comprehensive test suite with 113+ tests and CI/CD pipeline
- 🔧 **Data Validation**: Strict validation with configurable error/warning handling

## Installation

### Global Installation
```bash
npm install -g @your-org/crd-mcp-server
crdmcp --help
```

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd crd-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Quick Start

### 1. Start the MCP Server
```bash
# Using the CLI
crdmcp start examples/company-a --verbose

# Or using npm script
npm run server -- --data-dir ./examples/company-a --verbose
```

### 2. Validate Your Data
```bash
# Basic validation
crdmcp validate examples/company-a

# Strict validation (warnings become errors)
crdmcp validate examples/company-a --strict --verbose
```

### 3. Get Information
```bash
# Table format (default)
crdmcp info examples/company-a

# JSON output
crdmcp info examples/company-a --format json

# YAML output with verbose details
crdmcp info examples/company-a --format yaml --verbose
```

### 4. Generate Example Structures
```bash
# Generate a complete company structure
crdmcp generate company-structure --name MyCompany --output ./my-company

# Generate a sample CRD
crdmcp generate sample-crd --name MyResource --output ./my-crds

# Generate a sample manifest
crdmcp generate sample-manifest --name MyApp --output ./my-samples

# Generate instruction templates
crdmcp generate instruction --name deployment-guide --output ./my-docs
```

## CLI Reference

The `crdmcp` command provides several subcommands for different operations:

### `crdmcp start` - Start MCP Server

Start the MCP server with your CRD data directory.

```bash
crdmcp start <data-dir> [options]

Options:
  --verbose, -v    Enable detailed logging                    [boolean]
  --port, -p       MCP server port (if applicable)           [number]
  --watch, -w      Watch data directory for changes          [boolean]
```

**Example:**
```bash
# Start server with file watching
crdmcp start ./my-company-data --verbose --watch
```

### `crdmcp validate` - Validate Data

Validate the structure and content of your CRD data directory.

```bash
crdmcp validate <data-dir> [options]

Options:
  --verbose, -v    Enable detailed validation output         [boolean]
  --strict, -s     Enable strict mode (warnings → errors)    [boolean]
```

**Example:**
```bash
# Strict validation with detailed output
crdmcp validate ./my-company-data --strict --verbose
```

### `crdmcp info` - Display Information

Show comprehensive information about your CRD data directory.

```bash
crdmcp info <data-dir> [options]

Options:
  --format, -f     Output format: table|json|yaml           [default: table]
  --verbose, -v    Show detailed information                 [boolean]
```

**Example:**
```bash
# JSON output with all details
crdmcp info ./my-company-data --format json --verbose
```

### `crdmcp generate` - Generate Templates

Generate example data structures and templates.

```bash
crdmcp generate <type> [options]

Types:
  company-structure    Complete company data structure
  sample-crd          Sample CRD definition
  sample-manifest     Sample Kubernetes manifest
  instruction         Instruction document template

Options:
  --output, -o     Output directory                          [default: ./generated]
  --name, -n       Name for generated resources              [string]
  --force          Overwrite existing files                  [boolean]
```

**Examples:**
```bash
# Generate complete company structure
crdmcp generate company-structure --name "Acme Corp" --output ./acme-data

# Generate CRD with custom name
crdmcp generate sample-crd --name DatabaseCluster --output ./crds
```

## Data Directory Structure

Your CRD data directory should follow this structure:

```
company-data/
├── crds/                    # Custom Resource Definitions
│   ├── app-crd.yaml
│   └── database-crd.yaml
├── samples/                 # Sample Kubernetes manifests
│   ├── app-simple.yaml
│   ├── app-complex.yaml
│   └── database-cluster.yaml
└── instructions/            # Company-specific instructions
    ├── deployment-guide.md
    └── troubleshooting.md
```

### CRD Files (`crds/`)

Standard Kubernetes CRD YAML files. Example:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: webapps.example.com
spec:
  group: example.com
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              replicas:
                type: integer
                minimum: 1
              image:
                type: string
          status:
            type: object
  scope: Namespaced
  names:
    plural: webapps
    singular: webapp
    kind: WebApp
```

### Sample Files (`samples/`)

Example Kubernetes manifests using your CRDs. Include frontmatter for metadata:

```yaml
---
# Metadata (optional frontmatter)
name: "simple-webapp"
description: "Basic WebApp configuration"
complexity: "simple"
tags: ["webapp", "basic", "demo"]
---
apiVersion: example.com/v1
kind: WebApp
metadata:
  name: my-webapp
  namespace: default
spec:
  replicas: 3
  image: nginx:1.21
```

### Instruction Files (`instructions/`)

Markdown documents with company-specific guidance. Include frontmatter for categorization:

```markdown
---
title: "WebApp Deployment Guide"
tags: ["webapp", "deployment", "production"]
category: "deployment"
priority: 1
---

# WebApp Deployment Guide

This guide covers best practices for deploying WebApp resources...
```

## MCP Tools Available

When running as an MCP server, the following tools are automatically available:

### `list-available-resources`
List all available CRD types in your data directory.

### `get-resource-details`
Get detailed information about a specific CRD type, including schema and examples.

### `find-sample-manifests`
Search for sample manifests by resource type, complexity, or tags.

### `get-resource-guidance`
Get company-specific guidance and instructions for a resource type.

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format

# Type checking
npm run type-check

# Run all CI checks locally
npm run ci
```

## CI/CD Pipeline

This project includes a comprehensive CI/CD pipeline that runs on every PR:

### Required Checks
- ✅ **Linting**: ESLint and Prettier formatting
- ✅ **Testing**: Jest test suite with coverage reporting
- ✅ **Building**: TypeScript compilation
- ✅ **Type Checking**: Full type validation

### Running CI Locally
```bash
# Run all CI checks
npm run lint && npm test && npm run build
```

## Project Structure

```
├── src/
│   ├── loaders/        # Data loading modules
│   ├── tools/          # MCP tool implementations
│   ├── types/          # TypeScript definitions
│   └── utils/          # Helper functions
├── tests/              # Test suite
│   ├── fixtures/       # Test data
│   └── loaders/        # Loader tests
├── examples/           # Example company data
└── .github/            # CI/CD configuration
```

## Testing

The project includes comprehensive testing with 113+ tests across 9 test suites:

- **Unit Tests**: Individual loaders and utilities
- **Integration Tests**: Data loading pipeline and tool functionality
- **End-to-End Tests**: Complete user scenarios and workflows
- **Coverage Reports**: Automatically generated with each test run

Run tests:
```bash
npm test                # Run all tests
npm run test:watch      # Run in watch mode
npm run test:coverage   # Generate coverage report
```

### Test Structure
```
tests/
├── fixtures/           # Test data and mocks
├── loaders/           # Data loader tests
├── tools/             # MCP tool tests
└── integration/       # End-to-end scenarios
```

## Configuration

### Environment Variables

The server can be configured using environment variables:

```bash
# Logging configuration
CRDMCP_LOG_LEVEL=debug        # error|warn|info|debug|trace
CRDMCP_VERBOSE=true           # Enable verbose logging
CRDMCP_LOG_TIMESTAMPS=true    # Show timestamps in logs

# Server configuration
CRDMCP_PORT=3000             # MCP server port
CRDMCP_WATCH_FILES=true      # Enable file watching
```

### Logging Configuration

Configure advanced logging features:

```javascript
// Create logger with custom configuration
const logger = new Logger(verbose, {
  level: LogLevel.DEBUG,
  showTimestamps: true,
  showContext: true,
  useColors: true
});

// Use contextual logging
const crdLogger = logger.withContext('CRD');
crdLogger.info('Loading CRDs...');  // Output: [CRD] ℹ️ Loading CRDs...
```

### Performance Tuning

For large datasets, consider these optimizations:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Use parallel loading (default)
crdmcp start ./large-dataset --verbose

# Monitor performance
crdmcp info ./large-dataset --verbose  # Shows load times
```

## Troubleshooting

### Common Issues

#### "Data directory validation failed"
```bash
# Check directory structure
crdmcp validate ./my-data --verbose

# Expected structure:
my-data/
├── crds/
├── samples/
└── instructions/
```

#### "Failed to load YAML file"
```bash
# Validate YAML syntax
crdmcp validate ./my-data --strict --verbose

# Common issues:
# - Invalid YAML syntax
# - Missing required CRD fields
# - Malformed frontmatter in samples
```

#### "Orphaned samples detected"
```bash
# Check for samples without corresponding CRDs
crdmcp validate ./my-data --verbose

# Fix by either:
# 1. Adding missing CRD files
# 2. Removing orphaned samples
# 3. Correcting resource kinds in samples
```

#### "High memory usage"
```bash
# Monitor memory during loading
NODE_OPTIONS="--max-old-space-size=4096" crdmcp start ./large-data

# Consider splitting large datasets
crdmcp generate company-structure --name subset1 --output ./data-subset1
```

### Debug Mode

Enable comprehensive debugging:

```bash
# Maximum verbosity
crdmcp start ./my-data --verbose

# With environment variables
CRDMCP_LOG_LEVEL=trace CRDMCP_VERBOSE=true crdmcp start ./my-data

# Debug specific components
DEBUG=crd-loader,sample-loader crdmcp start ./my-data
```

### Performance Monitoring

Monitor performance metrics:

```bash
# Get detailed timing information
crdmcp info ./my-data --verbose

# Example output:
# Performance metrics:
#    Total load time: 1250ms
#    CRD loading: 450ms
#    Sample loading: 380ms
#    Instruction loading: 420ms
```

## API Reference

### MCP Server API

When running as an MCP server, these tools are available to AI assistants:

#### `list-available-resources()`
Returns all available CRD types.

**Response:**
```json
{
  "resources": [
    {
      "kind": "WebApp",
      "group": "example.com",
      "scope": "Namespaced",
      "description": "Web application deployment resource",
      "shortNames": ["webapp", "wa"],
      "category": "application"
    }
  ]
}
```

#### `get-resource-details(resourceType: string)`
Get comprehensive details about a specific resource type.

**Parameters:**
- `resourceType`: CRD kind, group, or short name

**Response:**
```json
{
  "resource": {
    "kind": "WebApp",
    "group": "example.com",
    "versions": ["v1"],
    "schema": { "openAPIV3Schema": "..." },
    "examples": ["simple", "complex"],
    "guidance": "Available in deployment-guide.md"
  }
}
```

#### `find-sample-manifests(filters: object)`
Search for sample manifests with various filters.

**Parameters:**
```json
{
  "kind": "WebApp",           // Optional: filter by resource kind
  "complexity": "simple",     // Optional: simple|medium|complex
  "tags": ["production"],     // Optional: filter by tags
  "searchTerm": "nginx"       // Optional: search in content
}
```

#### `get-resource-guidance(resourceType: string)`
Get company-specific guidance for a resource type.

**Response:**
```json
{
  "instructions": [
    {
      "title": "WebApp Deployment Guide",
      "content": "# WebApp Deployment Guide\n\n...",
      "tags": ["webapp", "deployment"],
      "category": "deployment"
    }
  ]
}
```

## Examples

### Example 1: Basic WebApp CRD

**CRD Definition** (`crds/webapp-crd.yaml`):
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: webapps.example.com
spec:
  group: example.com
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            required: ["image"]
            properties:
              image:
                type: string
                description: "Container image to deploy"
              replicas:
                type: integer
                minimum: 1
                default: 1
              resources:
                type: object
  scope: Namespaced
  names:
    plural: webapps
    singular: webapp
    kind: WebApp
    shortNames: ["wa"]
```

**Simple Sample** (`samples/webapp-simple.yaml`):
```yaml
---
name: "simple-webapp"
description: "Basic WebApp with minimal configuration"
complexity: "simple"
tags: ["webapp", "basic", "demo"]
---
apiVersion: example.com/v1
kind: WebApp
metadata:
  name: my-webapp
  namespace: production
spec:
  image: nginx:1.21
  replicas: 3
```

**Complex Sample** (`samples/webapp-complex.yaml`):
```yaml
---
name: "production-webapp"
description: "Production-ready WebApp with full configuration"
complexity: "complex"
tags: ["webapp", "production", "monitoring", "security"]
---
apiVersion: example.com/v1
kind: WebApp
metadata:
  name: production-webapp
  namespace: production
  labels:
    app: my-app
    version: "1.0.0"
    environment: production
spec:
  image: myregistry.com/my-app:1.0.0
  replicas: 5
  resources:
    requests:
      cpu: "500m"
      memory: "512Mi"
    limits:
      cpu: "1000m"
      memory: "1Gi"
  securityContext:
    runAsNonRoot: true
    readOnlyRootFilesystem: true
  monitoring:
    enabled: true
    port: 8080
    path: /metrics
```

**Instruction Guide** (`instructions/webapp-guide.md`):
```markdown
---
title: "WebApp Deployment Guide"
tags: ["webapp", "deployment", "production", "best-practices"]
category: "deployment"
priority: 1
---

# WebApp Deployment Guide

## Overview
This guide covers best practices for deploying WebApp resources in our Kubernetes clusters.

## Prerequisites
- Kubernetes cluster with version 1.20+
- WebApp CRD installed
- Proper RBAC permissions

## Basic Deployment

### 1. Simple WebApp
For development and testing:

```bash
kubectl apply -f samples/webapp-simple.yaml
```

### 2. Production WebApp
For production deployments:

```bash
kubectl apply -f samples/webapp-complex.yaml
```

## Configuration Guidelines

### Resource Sizing
- **Development**: 1 replica, 256Mi memory
- **Staging**: 2-3 replicas, 512Mi memory
- **Production**: 3+ replicas, 1Gi+ memory

### Security Best Practices
- Always set `runAsNonRoot: true`
- Use `readOnlyRootFilesystem` when possible
- Implement resource limits
- Use network policies

### Monitoring
- Enable monitoring for all production workloads
- Set appropriate health check endpoints
- Configure alerting rules

## Troubleshooting

### Common Issues
1. **ImagePullBackOff**: Check image registry access
2. **CrashLoopBackOff**: Review application logs
3. **Resource constraints**: Increase limits

### Useful Commands
```bash
# Check WebApp status
kubectl get webapps -n production

# Describe WebApp resource
kubectl describe webapp my-webapp -n production

# View logs
kubectl logs -l app=my-webapp -n production
```
```

### Example 2: Database Cluster CRD

For more complex scenarios, see the complete example in `examples/company-a/`.

## Contributing

Please see [Contributing Guidelines](.github/CONTRIBUTING.md) for details.

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a PR using the template

All PRs must pass the following checks:
- Linting (no errors)
- All tests passing
- Successful build
- Code review approval

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Author

Petre Popescu

## Status

🚧 **Under Development** - See [TODO.md](TODO.md) for roadmap