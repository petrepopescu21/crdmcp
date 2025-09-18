import type { LoadedData, CRDMetadata, SampleManifest, InstructionDocument } from '../../src/types/index.js';

export function createTestData(): LoadedData {
  // Create test CRDs
  const testCRD: CRDMetadata = {
    group: 'example.com',
    kind: 'TestResource',
    plural: 'testresources',
    singular: 'testresource',
    shortNames: ['test', 'tr'],
    scope: 'Namespaced',
    versions: ['v1'],
    filePath: '/test/crd.yaml',
    description: 'A test resource for unit testing',
    category: 'service',
  };

  const databaseCRD: CRDMetadata = {
    group: 'databases.example.com',
    kind: 'PostgreSQLCluster',
    plural: 'postgresqlclusters',
    singular: 'postgresqlcluster',
    shortNames: ['pg'],
    scope: 'Namespaced',
    versions: ['v1', 'v1beta1'],
    filePath: '/test/db-crd.yaml',
    description: 'PostgreSQL cluster resource',
    category: 'database',
  };

  const crds = new Map<string, CRDMetadata>();
  crds.set('example.com/TestResource', testCRD);
  crds.set('databases.example.com/PostgreSQLCluster', databaseCRD);

  // Create test samples
  const testSample: SampleManifest = {
    content: {
      apiVersion: 'example.com/v1',
      kind: 'TestResource',
      metadata: {
        name: 'test-sample',
        namespace: 'default',
      },
      spec: {
        replicas: 3,
        enabled: true,
      },
    },
    apiVersion: 'example.com/v1',
    kind: 'TestResource',
    metadata: {
      name: 'test-sample',
      namespace: 'default',
    },
    filePath: '/test/sample.yaml',
    description: 'Simple test resource example',
    tags: ['test', 'example', 'simple'],
    complexity: 'simple',
  };

  const dbSample: SampleManifest = {
    content: {
      apiVersion: 'databases.example.com/v1',
      kind: 'PostgreSQLCluster',
      metadata: {
        name: 'prod-db',
        namespace: 'production',
      },
      spec: {
        replicas: 3,
        storage: '100Gi',
        version: '14',
      },
    },
    apiVersion: 'databases.example.com/v1',
    kind: 'PostgreSQLCluster',
    metadata: {
      name: 'prod-db',
      namespace: 'production',
    },
    filePath: '/test/db-sample.yaml',
    description: 'Production PostgreSQL cluster',
    tags: ['production', 'database', 'postgresql'],
    complexity: 'intermediate',
  };

  const samples = new Map<string, SampleManifest[]>();
  samples.set('TestResource', [testSample]);
  samples.set('PostgreSQLCluster', [dbSample]);

  // Create test instructions
  const testInstruction: InstructionDocument = {
    title: 'Test Resource Guide',
    content: `# Test Resource Guide

This guide explains how to use TestResource effectively.

## Basic Configuration

Create a simple test resource:

\`\`\`yaml
apiVersion: example.com/v1
kind: TestResource
metadata:
  name: my-test
spec:
  enabled: true
\`\`\`

## Best Practices

- Always enable the resource in production
- Monitor resource usage regularly
`,
    filePath: '/test/test-guide.md',
    frontmatter: {
      title: 'Test Resource Guide',
      applicableCRDs: ['TestResource'],
      tags: ['testing', 'guide'],
      category: 'service',
      priority: 5,
    },
    detectedCRDs: ['testresource'],
    tags: ['testing', 'guide', 'service'],
  };

  const dbInstruction: InstructionDocument = {
    title: 'PostgreSQL Cluster Setup',
    content: `# PostgreSQL Cluster Setup

Configure PostgreSQL clusters for production use.

## Production Guidelines

For production deployments:
- Use at least 3 replicas
- Configure backup policies
- Set resource limits
`,
    filePath: '/test/db-guide.md',
    frontmatter: {
      title: 'PostgreSQL Cluster Setup',
      applicableCRDs: ['PostgreSQLCluster'],
      tags: ['database', 'production'],
      category: 'database',
      priority: 10,
    },
    detectedCRDs: ['postgresqlcluster'],
    tags: ['database', 'production', 'postgresql'],
  };

  const instructions = [testInstruction, dbInstruction];

  return {
    crds,
    samples,
    instructions,
    statistics: {
      crdsLoaded: crds.size,
      samplesLoaded: 2,
      instructionsLoaded: instructions.length,
      loadTime: 100,
      errors: [],
      warnings: [],
    },
  };
}