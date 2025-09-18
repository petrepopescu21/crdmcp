# CRD MCP Server Examples

This document provides comprehensive examples for using the CRD MCP Server with different types of organizations and use cases.

## Table of Contents
- [Quick Start](#quick-start)
- [Company A: Technology Company](#company-a-technology-company)
- [Company B: Financial Services](#company-b-financial-services)
- [Creating Your Own Company Structure](#creating-your-own-company-structure)
- [CLI Usage Examples](#cli-usage-examples)
- [MCP Tool Examples](#mcp-tool-examples)
- [Advanced Scenarios](#advanced-scenarios)

## Quick Start

### 1. Start with an Example Company

```bash
# Use Company A (Technology/SaaS)
crdmcp start examples/company-a --verbose

# Or use Company B (Financial Services)
crdmcp start examples/company-b --verbose
```

### 2. Validate Your Setup

```bash
# Validate the data structure
crdmcp validate examples/company-a

# Get information about available resources
crdmcp info examples/company-a --format table
```

### 3. Connect with Claude

Configure Claude Desktop to use the MCP server:

```json
{
  "mcpServers": {
    "crd-server": {
      "command": "npx",
      "args": ["crdmcp", "start", "./my-company-data"]
    }
  }
}
```

## Company A: Technology Company

Company A represents "Acme Corp", a technology company with web applications, databases, and API gateways.

### Available Resources

| Resource Type | Description | Use Cases |
|--------------|-------------|-----------|
| WebApp | Web application deployments | Frontend services, APIs, microservices |
| Database | Database clusters | PostgreSQL, MySQL, Redis, MongoDB |
| APIGateway | API gateway and routing | Service mesh, load balancing, SSL termination |

### Example Deployment Flow

#### 1. Deploy a Web Application

View available web app configurations:
```bash
crdmcp info examples/company-a | grep WebApp
```

Deploy using the simple configuration:
```bash
# Reference: examples/company-a/samples/webapp-simple.yaml
kubectl apply -f examples/company-a/samples/webapp-simple.yaml
```

#### 2. Set Up a Database

Deploy a PostgreSQL cluster:
```bash
# Reference: examples/company-a/samples/database-postgresql.yaml
kubectl apply -f examples/company-a/samples/database-postgresql.yaml
```

#### 3. Configure API Gateway

Set up routing for your services:
```bash
# Reference: examples/company-a/samples/apigateway-production.yaml
kubectl apply -f examples/company-a/samples/apigateway-production.yaml
```

### Instruction Documents

- `webapp-deployment-guide.md` - Complete deployment procedures
- `database-management.md` - Database operations and maintenance
- `apigateway-operations.md` - API gateway configuration and troubleshooting

## Company B: Financial Services

Company B represents "FinTech Corp", a financial services company with trading engines, risk monitoring, and data pipelines.

### Available Resources

| Resource Type | Description | Use Cases |
|--------------|-------------|-----------|
| TradingEngine | High-frequency trading systems | Algorithmic trading, market making |
| RiskMonitor | Risk management and compliance | VaR calculation, stress testing |
| DataPipeline | Real-time data processing | Market data, trade feeds, analytics |

### Example Trading System Setup

#### 1. Deploy Trading Engine

Deploy high-frequency arbitrage engine:
```bash
# Reference: examples/company-b/samples/trading-engine-hft.yaml
kubectl apply -f examples/company-b/samples/trading-engine-hft.yaml
```

#### 2. Configure Risk Monitoring

Set up portfolio risk monitoring:
```bash
# Reference: examples/company-b/samples/risk-monitor-portfolio.yaml
kubectl apply -f examples/company-b/samples/risk-monitor-portfolio.yaml
```

#### 3. Establish Data Pipeline

Deploy market data ingestion:
```bash
# Reference: examples/company-b/samples/data-pipeline-market-data.yaml
kubectl apply -f examples/company-b/samples/data-pipeline-market-data.yaml
```

### Instruction Documents

- `trading-engine-operations.md` - Trading strategy deployment
- `risk-management-guide.md` - Risk monitoring and compliance
- `data-pipeline-guide.md` - Data ingestion and processing

## Creating Your Own Company Structure

### Step 1: Generate Base Structure

```bash
# Generate a complete company structure
crdmcp generate company-structure --name "MyCompany" --output ./my-company

# This creates:
# my-company/
# ├── crds/
# ├── samples/
# └── instructions/
```

### Step 2: Add Your CRDs

Create a CRD definition:
```bash
crdmcp generate sample-crd --name MyService --output ./my-company/crds
```

Example CRD structure:
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: myservices.mycompany.io
spec:
  group: mycompany.io
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
            # Add your schema here
  scope: Namespaced
  names:
    plural: myservices
    singular: myservice
    kind: MyService
```

### Step 3: Create Sample Manifests

Generate sample manifests:
```bash
crdmcp generate sample-manifest --name my-service-dev --output ./my-company/samples
```

Add frontmatter metadata:
```yaml
---
name: "my-service-dev"
description: "Development configuration for MyService"
complexity: "simple"
tags: ["development", "myservice"]
environment: "development"
---
apiVersion: mycompany.io/v1
kind: MyService
metadata:
  name: my-service
  namespace: development
spec:
  # Your configuration here
```

### Step 4: Write Instructions

Generate instruction template:
```bash
crdmcp generate instruction --name myservice-guide --output ./my-company/instructions
```

Include frontmatter:
```markdown
---
title: "MyService Deployment Guide"
tags: ["myservice", "deployment", "operations"]
category: "deployment"
priority: 1
---

# MyService Deployment Guide

## Overview
[Your documentation here]
```

### Step 5: Validate Your Structure

```bash
# Validate the complete structure
crdmcp validate ./my-company --strict

# Check what resources are available
crdmcp info ./my-company --format json
```

## CLI Usage Examples

### Validation Examples

```bash
# Basic validation
crdmcp validate ./data --verbose

# Strict validation (warnings become errors)
crdmcp validate ./data --strict

# Validate specific company examples
crdmcp validate examples/company-a
crdmcp validate examples/company-b
```

### Information Queries

```bash
# Table format (default)
crdmcp info ./data

# JSON format for programmatic use
crdmcp info ./data --format json > resources.json

# YAML format
crdmcp info ./data --format yaml

# Verbose output with all details
crdmcp info ./data --verbose
```

### Server Operations

```bash
# Start server with default settings
crdmcp start ./data

# Start with file watching for hot reload
crdmcp start ./data --watch

# Start with verbose logging
crdmcp start ./data --verbose

# Start with custom port
crdmcp start ./data --port 8080
```

### Generation Commands

```bash
# Generate complete company structure
crdmcp generate company-structure --name "ACME" --output ./acme

# Generate individual CRD
crdmcp generate sample-crd --name Widget --output ./crds

# Generate sample manifest
crdmcp generate sample-manifest --name widget-prod --output ./samples

# Generate instruction document
crdmcp generate instruction --name widget-guide --output ./docs

# Force overwrite existing files
crdmcp generate company-structure --name "Test" --output ./test --force
```

## MCP Tool Examples

When running as an MCP server, these tools are available to AI assistants:

### List Available Resources

```javascript
// Tool: list-available-resources
// Returns all available CRD types

Response: {
  "resources": [
    {
      "kind": "WebApp",
      "group": "acme.io",
      "scope": "Namespaced",
      "description": "Web application deployment resource",
      "shortNames": ["wa"],
      "category": "application"
    },
    // ... more resources
  ]
}
```

### Get Resource Details

```javascript
// Tool: get-resource-details
// Parameters: { "resourceType": "WebApp" }

Response: {
  "resource": {
    "kind": "WebApp",
    "group": "acme.io",
    "versions": ["v1"],
    "schema": { /* OpenAPI schema */ },
    "examples": ["simple", "production"],
    "guidance": "Available in webapp-deployment-guide.md"
  }
}
```

### Find Sample Manifests

```javascript
// Tool: find-sample-manifests
// Parameters: {
//   "kind": "WebApp",
//   "complexity": "simple",
//   "tags": ["production"]
// }

Response: {
  "samples": [
    {
      "name": "webapp-production",
      "kind": "WebApp",
      "description": "Production WebApp configuration",
      "complexity": "complex",
      "tags": ["webapp", "production", "scaling"],
      "content": "..." // Full YAML content
    }
  ]
}
```

### Get Resource Guidance

```javascript
// Tool: get-resource-guidance
// Parameters: { "resourceType": "Database" }

Response: {
  "instructions": [
    {
      "title": "Database Management Guide",
      "content": "...", // Full markdown content
      "tags": ["database", "operations"],
      "category": "database"
    }
  ]
}
```

## Advanced Scenarios

### Multi-Environment Setup

```bash
# Development environment
crdmcp start ./data/dev --verbose

# Staging environment
crdmcp start ./data/staging --verbose

# Production environment
crdmcp start ./data/prod --verbose --watch
```

### CI/CD Integration

```yaml
# GitHub Actions workflow
name: Validate CRD Data

on:
  pull_request:
    paths:
      - 'data/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install CRD MCP CLI
        run: npm install -g crdmcp

      - name: Validate Data Structure
        run: crdmcp validate ./data --strict

      - name: Generate Info Report
        run: crdmcp info ./data --format json > report.json

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: crd-report
          path: report.json
```

### Docker Deployment

```dockerfile
# Dockerfile for CRD MCP Server
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Copy company data
COPY ./my-company-data /data

# Build the application
RUN npm run build

# Expose port if needed
EXPOSE 3000

# Start the server
CMD ["npx", "crdmcp", "start", "/data", "--verbose"]
```

### Kubernetes Deployment

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: crd-data
  namespace: mcp-server
data:
  # Your CRD definitions, samples, and instructions here

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crd-mcp-server
  namespace: mcp-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: crd-mcp-server
  template:
    metadata:
      labels:
        app: crd-mcp-server
    spec:
      containers:
      - name: server
        image: crd-mcp-server:latest
        command: ["npx", "crdmcp", "start", "/data"]
        volumeMounts:
        - name: crd-data
          mountPath: /data
      volumes:
      - name: crd-data
        configMap:
          name: crd-data
```

### Monitoring Setup

```bash
# Enable verbose logging for monitoring
crdmcp start ./data --verbose

# Parse logs for metrics
kubectl logs -f deployment/crd-mcp-server | grep "📊"

# Check server health
curl http://localhost:3000/health
```

## Best Practices

### 1. Directory Organization

```
my-company/
├── crds/
│   ├── core/           # Core platform resources
│   ├── apps/           # Application resources
│   └── infra/          # Infrastructure resources
├── samples/
│   ├── dev/            # Development examples
│   ├── staging/        # Staging examples
│   └── prod/           # Production examples
└── instructions/
    ├── deployment/      # Deployment guides
    ├── operations/      # Operational procedures
    └── troubleshooting/ # Problem resolution
```

### 2. Naming Conventions

- **CRDs**: Use lowercase with hyphens (`webapp-crd.yaml`)
- **Samples**: Include environment and purpose (`webapp-prod-ha.yaml`)
- **Instructions**: Use descriptive names (`webapp-deployment-guide.md`)

### 3. Metadata Standards

Always include comprehensive frontmatter:

```yaml
---
name: "resource-name"
description: "Clear description of purpose"
complexity: "simple|medium|complex"
tags: ["tag1", "tag2", "tag3"]
environment: "development|staging|production"
version: "1.0.0"
author: "team-name"
last-updated: "2024-01-15"
---
```

### 4. Validation Pipeline

```bash
#!/bin/bash
# validation.sh

# Strict validation
crdmcp validate ./data --strict || exit 1

# Check for required files
test -d ./data/crds || { echo "Missing crds directory"; exit 1; }
test -d ./data/samples || { echo "Missing samples directory"; exit 1; }
test -d ./data/instructions || { echo "Missing instructions directory"; exit 1; }

# Generate report
crdmcp info ./data --format json > validation-report.json

echo "✅ Validation successful"
```

### 5. Version Control

```gitignore
# .gitignore for CRD data
*.tmp
*.backup
.DS_Store
generated/
dist/
node_modules/
```

## Troubleshooting

### Common Issues and Solutions

#### Data Directory Not Found
```bash
# Check directory exists
ls -la ./data

# Use absolute path
crdmcp start $(pwd)/data
```

#### YAML Parsing Errors
```bash
# Validate YAML syntax
yamllint ./data/crds/*.yaml

# Use strict validation
crdmcp validate ./data --strict --verbose
```

#### Missing Dependencies
```bash
# Install required packages
npm install

# Build the project
npm run build

# Try again
crdmcp start ./data
```

#### Performance Issues
```bash
# Check resource usage
crdmcp info ./data --verbose

# Optimize large datasets
# Split into smaller files
# Use pagination for samples
```

## Additional Resources

- **Repository**: [GitHub - CRD MCP Server](https://github.com/your-org/crd-mcp-server)
- **Documentation**: [Full API Documentation](https://docs.your-org.com/crd-mcp)
- **Examples**: This directory contains two complete company examples
- **Support**: Open an issue on GitHub or contact support@your-org.com

## Contributing

To contribute additional examples:

1. Fork the repository
2. Create a new example in `examples/company-x/`
3. Follow the structure of existing examples
4. Validate your example: `crdmcp validate examples/company-x --strict`
5. Submit a pull request with description

## License

ISC License - See LICENSE file for details.