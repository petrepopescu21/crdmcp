# CRD MCP Server - Quick Start Guide

Get up and running with the CRD MCP Server in 5 minutes!

## 🚀 Quick Installation

```bash
# Clone and install
git clone https://github.com/your-org/crd-mcp-server.git
cd crd-mcp-server
npm install
npm run build
```

## 🎯 Three Ways to Start

### Option 1: Use Example Data (Fastest)
```bash
# Start with pre-built technology company example
npm run server -- --data-dir ./examples/company-a

# Or start with financial services example
npm run server -- --data-dir ./examples/company-b
```

### Option 2: Generate Your Own
```bash
# Generate a complete company structure
npx crdmcp generate company-structure --name "MyCompany" --output ./my-data

# Start the server
npx crdmcp start ./my-data --verbose
```

### Option 3: Copy and Customize
```bash
# Copy an example as starting point
cp -r examples/company-a my-company

# Edit the files to match your needs
# Then start the server
npx crdmcp start ./my-company --watch
```

## 📋 Essential Commands

```bash
# Validate your data
npx crdmcp validate ./my-data --strict

# Get information about resources
npx crdmcp info ./my-data

# Start server with file watching
npx crdmcp start ./my-data --watch --verbose

# Generate sample CRD
npx crdmcp generate sample-crd --name MyResource --output ./my-data/crds
```

## 🤖 Connect with Claude

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "crd-server": {
      "command": "node",
      "args": [
        "C:/path/to/crd-mcp-server/dist/cli/index.js",
        "start",
        "C:/path/to/my-data"
      ]
    }
  }
}
```

## 📁 Required Directory Structure

```
my-data/
├── crds/          # Your CRD definitions (*.yaml)
├── samples/       # Sample manifests (*.yaml)
└── instructions/  # Documentation (*.md)
```

## ✨ Quick Examples

### Create a Simple CRD

`my-data/crds/myapp-crd.yaml`:
```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: myapps.example.com
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
  scope: Namespaced
  names:
    plural: myapps
    singular: myapp
    kind: MyApp
```

### Add a Sample

`my-data/samples/myapp-dev.yaml`:
```yaml
---
name: "myapp-dev"
description: "Development instance"
complexity: "simple"
tags: ["dev", "myapp"]
---
apiVersion: example.com/v1
kind: MyApp
metadata:
  name: myapp-dev
  namespace: development
spec:
  replicas: 1
```

### Write Instructions

`my-data/instructions/myapp-guide.md`:
```markdown
---
title: "MyApp Deployment Guide"
tags: ["myapp", "deployment"]
category: "deployment"
---

# MyApp Deployment Guide

## Quick Deploy
1. Apply the CRD: `kubectl apply -f crds/myapp-crd.yaml`
2. Deploy instance: `kubectl apply -f samples/myapp-dev.yaml`
3. Verify: `kubectl get myapps`
```

## 🔍 Verify Everything Works

```bash
# Validate structure
npx crdmcp validate ./my-data

# Check what's available
npx crdmcp info ./my-data

# Start the server
npx crdmcp start ./my-data --verbose
```

You should see:
```
🚀 Starting Generic CRD MCP Server...
📊 Loading CRD data...
✅ Loaded 1 CRDs
✅ Loaded 1 samples for 1 resource types
✅ Loaded 1 instruction documents
🔧 Registered 4 tools
🎉 MCP Server started successfully!
```

## 📚 Available MCP Tools

Once running, Claude can use these tools:

1. **list-available-resources** - Show all CRD types
2. **get-resource-details** - Get CRD schema and details
3. **find-sample-manifests** - Search for examples
4. **get-resource-guidance** - Get documentation

## 🆘 Need Help?

- **Full Documentation**: See [README.md](README.md)
- **Examples**: Check `examples/` directory
- **Usage Guide**: Read [USAGE_GUIDE.md](USAGE_GUIDE.md)
- **Troubleshooting**: Run with `--verbose` flag

## 🎉 That's It!

You're now running a CRD MCP Server! Claude can now help you with:
- Exploring available Kubernetes resources
- Generating deployment configurations
- Finding examples and best practices
- Troubleshooting Kubernetes deployments

Happy deploying! 🚀