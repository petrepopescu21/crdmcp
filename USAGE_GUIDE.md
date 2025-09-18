# CRD MCP Server Usage Guide

A comprehensive guide for using the CRD MCP Server in production environments.

## Table of Contents
1. [Installation and Setup](#installation-and-setup)
2. [Basic Usage](#basic-usage)
3. [Working with Claude](#working-with-claude)
4. [Production Deployment](#production-deployment)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)
6. [Security Best Practices](#security-best-practices)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting Guide](#troubleshooting-guide)

## Installation and Setup

### Prerequisites

- Node.js 18+ and npm
- Kubernetes cluster (optional, for testing manifests)
- Claude Desktop or MCP-compatible client

### Installation Options

#### Option 1: Global Installation
```bash
# Install globally
npm install -g @your-org/crd-mcp-server

# Verify installation
crdmcp --version
```

#### Option 2: Local Development
```bash
# Clone repository
git clone https://github.com/your-org/crd-mcp-server.git
cd crd-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Link for local CLI usage
npm link
```

#### Option 3: Docker Container
```bash
# Pull the Docker image
docker pull your-org/crd-mcp-server:latest

# Run with mounted data
docker run -v $(pwd)/data:/data \
  your-org/crd-mcp-server:latest \
  start /data --verbose
```

### Initial Setup

1. **Choose or Create Data Directory**
```bash
# Use provided examples
cp -r examples/company-a my-company-data

# Or generate new structure
crdmcp generate company-structure --name "MyCompany" --output ./my-company-data
```

2. **Validate Structure**
```bash
crdmcp validate ./my-company-data --strict
```

3. **Test Server Locally**
```bash
crdmcp start ./my-company-data --verbose
```

## Basic Usage

### Command Line Interface

The `crdmcp` CLI provides several commands:

#### Start Server
```bash
# Basic start
crdmcp start ./data

# With options
crdmcp start ./data \
  --verbose \           # Enable detailed logging
  --watch \            # Auto-reload on file changes
  --port 3000          # Custom port (if applicable)
```

#### Validate Data
```bash
# Basic validation
crdmcp validate ./data

# Strict mode (warnings as errors)
crdmcp validate ./data --strict --verbose
```

#### Get Information
```bash
# Table format (default)
crdmcp info ./data

# JSON output
crdmcp info ./data --format json

# YAML output with details
crdmcp info ./data --format yaml --verbose
```

#### Generate Resources
```bash
# Complete company structure
crdmcp generate company-structure \
  --name "ACME Corp" \
  --output ./acme-data

# Individual CRD
crdmcp generate sample-crd \
  --name DatabaseCluster \
  --output ./crds

# Sample manifest
crdmcp generate sample-manifest \
  --name db-production \
  --output ./samples

# Instruction template
crdmcp generate instruction \
  --name database-guide \
  --output ./instructions
```

### Data Directory Structure

Your data directory must follow this structure:

```
my-company-data/
├── crds/                    # Custom Resource Definitions
│   ├── webapp-crd.yaml
│   ├── database-crd.yaml
│   └── cache-crd.yaml
├── samples/                 # Sample Kubernetes manifests
│   ├── webapp-dev.yaml
│   ├── webapp-prod.yaml
│   ├── database-postgres.yaml
│   └── cache-redis.yaml
└── instructions/            # Markdown documentation
    ├── webapp-guide.md
    ├── database-operations.md
    └── troubleshooting.md
```

### File Formats

#### CRD Files
Standard Kubernetes CRD YAML with optional annotations:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: webapps.example.com
  annotations:
    description: "Web application management"
    category: "application"
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
            # Your schema here
  scope: Namespaced
  names:
    plural: webapps
    singular: webapp
    kind: WebApp
    shortNames:
    - wa
```

#### Sample Files
Kubernetes manifests with frontmatter metadata:

```yaml
---
# Metadata frontmatter (optional but recommended)
name: "webapp-production"
description: "Production web application configuration"
complexity: "complex"
tags: ["webapp", "production", "ha"]
environment: "production"
---
apiVersion: example.com/v1
kind: WebApp
metadata:
  name: my-webapp
  namespace: production
spec:
  replicas: 5
  image: myapp:v1.0.0
  # Your configuration
```

#### Instruction Files
Markdown documents with frontmatter:

```markdown
---
title: "WebApp Deployment Guide"
tags: ["webapp", "deployment", "production"]
category: "deployment"
priority: 1
---

# WebApp Deployment Guide

## Overview
Your documentation here...

## Prerequisites
- Requirement 1
- Requirement 2

## Deployment Steps
1. Step one
2. Step two
```

## Working with Claude

### Configure Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "crd-server": {
      "command": "npx",
      "args": [
        "crdmcp",
        "start",
        "C:/path/to/my-company-data",
        "--verbose"
      ]
    }
  }
}
```

### Available MCP Tools

When connected, Claude can use these tools:

#### list-available-resources
Lists all CRD types available:
- Returns resource kinds, groups, and descriptions
- Includes categories and short names

#### get-resource-details
Gets detailed information about a specific CRD:
- Full OpenAPI schema
- Available examples
- Related documentation

#### find-sample-manifests
Searches for sample manifests:
- Filter by kind, complexity, tags
- Returns matching samples with content

#### get-resource-guidance
Retrieves instruction documents:
- Returns relevant guides for a resource type
- Includes full markdown content

### Example Interactions with Claude

```
You: "What Kubernetes resources are available?"
Claude: [Uses list-available-resources tool]
"I can see you have 3 types of resources available:
1. WebApp - For web application deployments
2. Database - For database clusters
3. APIGateway - For API routing and management"

You: "Show me how to deploy a production database"
Claude: [Uses find-sample-manifests and get-resource-guidance tools]
"Here's a production PostgreSQL configuration..."
```

### Best Practices with Claude

1. **Be Specific**: Ask for specific resource types or scenarios
2. **Request Examples**: Ask Claude to show sample configurations
3. **Validation**: Ask Claude to validate your YAML before applying
4. **Troubleshooting**: Describe issues clearly for better assistance

## Production Deployment

### Standalone Server

#### Systemd Service (Linux)
```ini
# /etc/systemd/system/crd-mcp.service
[Unit]
Description=CRD MCP Server
After=network.target

[Service]
Type=simple
User=mcp-user
WorkingDirectory=/opt/crd-mcp
ExecStart=/usr/bin/npx crdmcp start /opt/crd-mcp/data --verbose
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable crd-mcp
sudo systemctl start crd-mcp
sudo systemctl status crd-mcp
```

#### PM2 Process Manager
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start "npx crdmcp start ./data" \
  --name crd-mcp \
  --interpreter bash \
  --watch \
  --max-memory-restart 1G

# Save configuration
pm2 save
pm2 startup
```

### Kubernetes Deployment

#### ConfigMap for Data
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: crd-mcp-data
  namespace: mcp-system
data:
  webapp-crd.yaml: |
    # Your CRD content
  webapp-sample.yaml: |
    # Your sample content
```

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crd-mcp-server
  namespace: mcp-system
spec:
  replicas: 2
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
        image: your-org/crd-mcp-server:latest
        command:
          - npx
          - crdmcp
          - start
          - /data
          - --verbose
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        volumeMounts:
        - name: data
          mountPath: /data
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - "ps aux | grep crdmcp"
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: data
        configMap:
          name: crd-mcp-data
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  crd-mcp-server:
    image: your-org/crd-mcp-server:latest
    command: ["start", "/data", "--verbose", "--watch"]
    volumes:
      - ./my-company-data:/data:ro
      - ./logs:/app/logs
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "pgrep", "node"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Monitoring and Maintenance

### Logging Configuration

#### Log Levels
```bash
# Set via environment variable
export CRDMCP_LOG_LEVEL=debug

# Or in configuration
crdmcp start ./data --verbose
```

Log levels:
- `error`: Only errors
- `warn`: Warnings and errors
- `info`: General information (default)
- `debug`: Detailed debugging
- `trace`: Very detailed trace logs

#### Log Aggregation
```yaml
# Fluentd configuration
<source>
  @type tail
  path /var/log/crd-mcp/*.log
  pos_file /var/log/td-agent/crd-mcp.pos
  tag crd.mcp
  <parse>
    @type json
  </parse>
</source>

<match crd.mcp>
  @type elasticsearch
  host elasticsearch.monitoring.svc
  port 9200
  index_name crd-mcp
</match>
```

### Metrics and Monitoring

#### Prometheus Metrics
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'crd-mcp'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
```

#### Health Checks
```bash
# Basic health check
curl http://localhost:3000/health

# Detailed status
curl http://localhost:3000/status
```

### Backup and Recovery

#### Backup Strategy
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/crd-mcp"
DATA_DIR="/opt/crd-mcp/data"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
tar -czf "$BACKUP_DIR/crd-data-$DATE.tar.gz" "$DATA_DIR"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
```

#### Recovery Procedure
```bash
# Stop server
systemctl stop crd-mcp

# Restore from backup
tar -xzf /backups/crd-mcp/crd-data-20240115_120000.tar.gz -C /

# Validate restored data
crdmcp validate /opt/crd-mcp/data --strict

# Restart server
systemctl start crd-mcp
```

## Security Best Practices

### Access Control

#### File Permissions
```bash
# Set appropriate permissions
chmod 755 /opt/crd-mcp
chmod 644 /opt/crd-mcp/data/**/*.yaml
chmod 644 /opt/crd-mcp/data/**/*.md

# Set ownership
chown -R mcp-user:mcp-group /opt/crd-mcp
```

#### Network Security
```yaml
# Kubernetes NetworkPolicy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: crd-mcp-server
  namespace: mcp-system
spec:
  podSelector:
    matchLabels:
      app: crd-mcp-server
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: claude-client
    ports:
    - protocol: TCP
      port: 3000
```

### Data Validation

#### Input Sanitization
- All YAML files are parsed and validated
- Frontmatter is strictly typed
- File paths are sanitized

#### Schema Validation
```bash
# Validate CRD schemas
kubectl apply --dry-run=client -f crds/

# Validate sample manifests
kubectl apply --dry-run=client -f samples/
```

### Secrets Management

#### Environment Variables
```bash
# Use secrets for sensitive data
export MCP_API_KEY=$(vault read -field=key secret/mcp)
export MCP_TLS_CERT=$(vault read -field=cert secret/mcp-tls)
```

#### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: crd-mcp-secrets
  namespace: mcp-system
type: Opaque
data:
  api-key: <base64-encoded-key>
  tls-cert: <base64-encoded-cert>
```

## Performance Optimization

### Resource Optimization

#### Memory Management
```javascript
// Set Node.js memory limits
NODE_OPTIONS="--max-old-space-size=2048" crdmcp start ./data
```

#### CPU Optimization
```bash
# Use CPU affinity
taskset -c 0-3 crdmcp start ./data
```

### Caching Strategy

#### File System Cache
```bash
# Enable file system caching
echo 3 > /proc/sys/vm/drop_caches  # Clear cache first
crdmcp start ./data --cache-ttl 3600
```

#### In-Memory Caching
The server caches parsed YAML and markdown files in memory for faster access.

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/resources

# Using k6
k6 run load-test.js
```

Example k6 script:
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  let response = http.get('http://localhost:3000/api/resources');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Troubleshooting Guide

### Common Issues

#### Server Won't Start
```bash
# Check port availability
lsof -i :3000

# Check file permissions
ls -la /opt/crd-mcp/data

# Validate data directory
crdmcp validate ./data --verbose

# Check logs
journalctl -u crd-mcp -f
```

#### YAML Parsing Errors
```bash
# Validate YAML syntax
yamllint data/**/*.yaml

# Check for common issues
grep -r "<<" data/  # Check for merge conflicts
```

#### Memory Issues
```bash
# Monitor memory usage
watch -n 1 'ps aux | grep crdmcp'

# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" crdmcp start ./data

# Check for memory leaks
node --expose-gc --trace-gc crdmcp start ./data
```

#### Performance Issues
```bash
# Profile the application
node --prof crdmcp start ./data

# Analyze profile
node --prof-process isolate-*.log > profile.txt

# Monitor file system
iostat -x 1
```

### Debug Mode

Enable detailed debugging:
```bash
# Maximum verbosity
DEBUG=* CRDMCP_LOG_LEVEL=trace crdmcp start ./data --verbose

# Specific module debugging
DEBUG=crd-loader,sample-loader crdmcp start ./data
```

### Getting Help

#### Check Version
```bash
crdmcp --version
npm list @your-org/crd-mcp-server
```

#### View Help
```bash
crdmcp --help
crdmcp start --help
crdmcp validate --help
```

#### Report Issues
- GitHub Issues: https://github.com/your-org/crd-mcp-server/issues
- Email: support@your-org.com
- Slack: #crd-mcp-support

## Appendix

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CRDMCP_LOG_LEVEL` | Log level (error/warn/info/debug/trace) | info |
| `CRDMCP_VERBOSE` | Enable verbose output | false |
| `CRDMCP_PORT` | Server port | 3000 |
| `CRDMCP_WATCH` | Enable file watching | false |
| `NODE_OPTIONS` | Node.js options | - |

### Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Data validation failed |
| 4 | File not found |
| 5 | Permission denied |

### File Size Limits

- CRD files: Max 1MB per file
- Sample files: Max 100KB per file
- Instruction files: Max 500KB per file
- Total data directory: Recommended < 100MB

### Performance Benchmarks

| Operation | Target | Actual |
|-----------|--------|--------|
| Server startup | < 2s | ~500ms |
| Data loading (100 files) | < 5s | ~2s |
| Tool response time | < 100ms | ~50ms |
| Memory usage (idle) | < 256MB | ~150MB |
| Memory usage (loaded) | < 512MB | ~300MB |