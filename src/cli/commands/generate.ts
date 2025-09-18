import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { Logger } from '../../utils/logger.js';

interface GenerateOptions {
  type: 'company-structure' | 'sample-crd' | 'sample-manifest' | 'instruction';
  output: string;
  name?: string;
  force?: boolean;
}

export async function generateCommand(argv: GenerateOptions) {
  const logger = new Logger(true); // Always verbose for generate command

  try {
    const outputDir = resolve(argv.output);

    logger.info(`🏗️  Generating ${argv.type}...`);

    switch (argv.type) {
      case 'company-structure':
        await generateCompanyStructure(outputDir, logger, argv.force || false);
        break;
      case 'sample-crd':
        await generateSampleCRD(outputDir, argv.name || 'MyResource', logger, argv.force || false);
        break;
      case 'sample-manifest':
        await generateSampleManifest(outputDir, argv.name || 'MyResource', logger, argv.force || false);
        break;
      case 'instruction':
        await generateInstruction(outputDir, argv.name || 'My Resource Guide', logger, argv.force || false);
        break;
      default:
        logger.error(`Unknown generation type: ${argv.type}`);
        process.exit(1);
    }

    logger.success(`✅ Generated ${argv.type} in ${outputDir}`);

  } catch (error) {
    logger.error('Failed to generate structure:', error);
    process.exit(1);
  }
}

async function generateCompanyStructure(outputDir: string, logger: Logger, force: boolean) {
  if (existsSync(outputDir) && !force) {
    logger.error(`Output directory already exists: ${outputDir}`);
    logger.info('Use --force to overwrite existing directory');
    process.exit(1);
  }

  // Create directory structure
  const dirs = [
    'crds',
    'samples/simple',
    'samples/intermediate',
    'samples/advanced',
    'instructions/getting-started',
    'instructions/best-practices',
    'instructions/troubleshooting',
  ];

  dirs.forEach(dir => {
    const fullPath = join(outputDir, dir);
    mkdirSync(fullPath, { recursive: true });
    logger.debug(`Created directory: ${fullPath}`);
  });

  // Generate example CRD
  const exampleCRD = `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: myservices.company.example.com
  annotations:
    description: "A custom service resource for company infrastructure"
spec:
  group: company.example.com
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
                maximum: 10
                default: 3
              image:
                type: string
              port:
                type: integer
                default: 8080
              enabled:
                type: boolean
                default: true
            required:
            - image
          status:
            type: object
            properties:
              phase:
                type: string
                enum: ["Pending", "Running", "Failed"]
              replicas:
                type: integer
  scope: Namespaced
  names:
    plural: myservices
    singular: myservice
    kind: MyService
    shortNames:
    - svc
    - mysvc
`;

  writeFileSync(join(outputDir, 'crds', 'myservice.yaml'), exampleCRD);
  logger.debug('Generated example CRD: myservice.yaml');

  // Generate simple sample
  const simpleSample = `apiVersion: company.example.com/v1
kind: MyService
metadata:
  name: simple-web-service
  namespace: default
  annotations:
    description: "A simple web service example"
    tags: "simple,web,example"
    complexity: "simple"
spec:
  image: nginx:1.21
  replicas: 1
  port: 80
  enabled: true
`;

  writeFileSync(join(outputDir, 'samples/simple', 'simple-web-service.yaml'), simpleSample);
  logger.debug('Generated simple sample: simple-web-service.yaml');

  // Generate intermediate sample
  const intermediateSample = `apiVersion: company.example.com/v1
kind: MyService
metadata:
  name: api-service
  namespace: production
  annotations:
    description: "Production API service with multiple replicas"
    tags: "intermediate,api,production"
    complexity: "intermediate"
spec:
  image: company/api-server:v2.1.0
  replicas: 3
  port: 8080
  enabled: true
  env:
    - name: DATABASE_URL
      value: "postgresql://api-db:5432/api"
    - name: REDIS_URL
      value: "redis://cache:6379"
  resources:
    requests:
      memory: "256Mi"
      cpu: "250m"
    limits:
      memory: "512Mi"
      cpu: "500m"
`;

  writeFileSync(join(outputDir, 'samples/intermediate', 'api-service.yaml'), intermediateSample);
  logger.debug('Generated intermediate sample: api-service.yaml');

  // Generate instruction document
  const instruction = `---
title: "MyService Resource Guide"
applicableCRDs: ["MyService"]
tags: ["getting-started", "guide", "service"]
category: "service"
priority: 10
---

# MyService Resource Guide

This guide explains how to use MyService custom resources effectively in your Kubernetes cluster.

## Overview

MyService is a custom resource that simplifies the deployment and management of web services and APIs within your company infrastructure.

## Basic Usage

### Creating a Simple Service

For basic web services or simple applications:

\`\`\`yaml
apiVersion: company.example.com/v1
kind: MyService
metadata:
  name: my-web-app
  namespace: default
spec:
  image: your-company/web-app:latest
  replicas: 2
  port: 8080
  enabled: true
\`\`\`

### Production Deployment

For production services that require high availability:

\`\`\`yaml
apiVersion: company.example.com/v1
kind: MyService
metadata:
  name: production-api
  namespace: production
spec:
  image: your-company/api:v1.2.3
  replicas: 5
  port: 8080
  enabled: true
  resources:
    requests:
      memory: "512Mi"
      cpu: "500m"
    limits:
      memory: "1Gi"
      cpu: "1000m"
\`\`\`

## Best Practices

1. **Always specify resource limits** for production workloads
2. **Use specific image tags** instead of \`latest\` in production
3. **Set appropriate replica counts** based on your traffic patterns
4. **Use namespaces** to organize your services by environment

## Common Issues

### Service Not Starting

If your service isn't starting, check:
- Image exists and is accessible
- Resource limits are appropriate
- Port configuration is correct

### High Resource Usage

To optimize resource usage:
- Monitor your service metrics
- Adjust resource requests and limits
- Consider horizontal pod autoscaling

## Related Resources

- Use \`ConfigMap\` for configuration files
- Use \`Secret\` for sensitive data like API keys
- Use \`Service\` and \`Ingress\` for network access
`;

  writeFileSync(join(outputDir, 'instructions/getting-started', 'myservice-guide.md'), instruction);
  logger.debug('Generated instruction: myservice-guide.md');

  // Generate README
  const readme = `# Company CRD Repository

This directory contains Custom Resource Definitions (CRDs), sample manifests, and instructions for company infrastructure resources.

## Directory Structure

- \`crds/\` - Custom Resource Definition YAML files
- \`samples/\` - Example manifests organized by complexity
  - \`simple/\` - Basic examples for getting started
  - \`intermediate/\` - Production-ready examples with more configuration
  - \`advanced/\` - Complex examples with advanced features
- \`instructions/\` - Documentation and guides
  - \`getting-started/\` - Basic usage guides
  - \`best-practices/\` - Production recommendations
  - \`troubleshooting/\` - Common issues and solutions

## Usage with CRD MCP Server

Start the MCP server with this directory:

\`\`\`bash
crdmcp start ./path/to/this/directory --verbose
\`\`\`

Validate the structure:

\`\`\`bash
crdmcp validate ./path/to/this/directory
\`\`\`

View information:

\`\`\`bash
crdmcp info ./path/to/this/directory
\`\`\`

## Adding Your Own Resources

1. Add CRD definitions to \`crds/\`
2. Create sample manifests in appropriate \`samples/\` subdirectories
3. Add documentation to \`instructions/\`
4. Use descriptive annotations on samples for better tool integration

## Sample Annotations

Sample manifests should include these annotations for optimal tool integration:

\`\`\`yaml
metadata:
  annotations:
    description: "Brief description of what this sample demonstrates"
    tags: "comma,separated,tags"
    complexity: "simple|intermediate|advanced"
\`\`\`
`;

  writeFileSync(join(outputDir, 'README.md'), readme);
  logger.debug('Generated README.md');
}

async function generateSampleCRD(outputDir: string, name: string, logger: Logger, force: boolean) {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `${name.toLowerCase()}.yaml`;
  const filePath = join(outputDir, fileName);

  if (existsSync(filePath) && !force) {
    logger.error(`File already exists: ${filePath}`);
    logger.info('Use --force to overwrite existing file');
    process.exit(1);
  }

  const crdContent = `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: ${name.toLowerCase()}s.company.example.com
  annotations:
    description: "Custom resource for ${name}"
spec:
  group: company.example.com
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
                default: 1
              enabled:
                type: boolean
                default: true
              config:
                type: object
                additionalProperties:
                  type: string
            required: []
          status:
            type: object
            properties:
              phase:
                type: string
                enum: ["Pending", "Running", "Failed"]
              conditions:
                type: array
                items:
                  type: object
                  properties:
                    type:
                      type: string
                    status:
                      type: string
                    reason:
                      type: string
                    message:
                      type: string
  scope: Namespaced
  names:
    plural: ${name.toLowerCase()}s
    singular: ${name.toLowerCase()}
    kind: ${name}
    shortNames:
    - ${name.toLowerCase().substring(0, 3)}
`;

  writeFileSync(filePath, crdContent);
  logger.debug(`Generated CRD: ${fileName}`);
}

async function generateSampleManifest(outputDir: string, name: string, logger: Logger, force: boolean) {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `${name.toLowerCase()}-example.yaml`;
  const filePath = join(outputDir, fileName);

  if (existsSync(filePath) && !force) {
    logger.error(`File already exists: ${filePath}`);
    logger.info('Use --force to overwrite existing file');
    process.exit(1);
  }

  const manifestContent = `apiVersion: company.example.com/v1
kind: ${name}
metadata:
  name: ${name.toLowerCase()}-example
  namespace: default
  annotations:
    description: "Example ${name} manifest"
    tags: "example,sample"
    complexity: "simple"
spec:
  replicas: 1
  enabled: true
  config:
    environment: "development"
    debug: "true"
`;

  writeFileSync(filePath, manifestContent);
  logger.debug(`Generated manifest: ${fileName}`);
}

async function generateInstruction(outputDir: string, title: string, logger: Logger, force: boolean) {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
  const filePath = join(outputDir, fileName);

  if (existsSync(filePath) && !force) {
    logger.error(`File already exists: ${filePath}`);
    logger.info('Use --force to overwrite existing file');
    process.exit(1);
  }

  const instructionContent = `---
title: "${title}"
applicableCRDs: ["MyResource"]
tags: ["guide", "documentation"]
category: "general"
priority: 5
---

# ${title}

This guide provides instructions for working with custom resources.

## Overview

Brief overview of what this guide covers.

## Prerequisites

List any prerequisites or requirements.

## Step-by-Step Instructions

### Step 1: Preparation

Describe the first step in detail.

\`\`\`bash
# Example command
kubectl get customresourcedefinitions
\`\`\`

### Step 2: Configuration

Describe configuration steps.

\`\`\`yaml
# Example YAML configuration
apiVersion: company.example.com/v1
kind: MyResource
metadata:
  name: example
spec:
  enabled: true
\`\`\`

### Step 3: Deployment

Describe deployment steps.

## Best Practices

- List important best practices
- Include security considerations
- Mention performance tips

## Troubleshooting

### Common Issues

**Issue**: Resource not creating
**Solution**: Check the resource definition and namespace

**Issue**: Permission denied
**Solution**: Verify RBAC permissions

## Related Resources

- Link to related documentation
- Reference other custom resources
- External documentation links
`;

  writeFileSync(filePath, instructionContent);
  logger.debug(`Generated instruction: ${fileName}`);
}