import { describe, expect, it } from '@jest/globals';
import { ResourceDetailsTool } from '../../src/tools/resource-details-tool.js';
import { createTestData } from './test-data-helper.js';

describe('ResourceDetailsTool', () => {
  let tool: ResourceDetailsTool;
  let testData: ReturnType<typeof createTestData>;

  beforeEach(() => {
    testData = createTestData();
    tool = new ResourceDetailsTool(testData);
  });

  describe('basic functionality', () => {
    it('should have correct name and description', () => {
      expect(tool.name).toBe('get-resource-details');
      expect(tool.description).toContain('comprehensive information');
    });

    it('should have proper input schema', () => {
      const schema = tool.inputSchema;
      expect(schema).toBeDefined();
      expect(schema.resourceType).toBeDefined();
    });
  });

  describe('get resource details', () => {
    it('should get details for existing resource by full key', async () => {
      const result = await tool.execute({
        resourceType: 'example.com/TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.metadata).toBeDefined();
      expect(result.data.metadata.kind).toBe('TestResource');
      expect(result.data.metadata.group).toBe('example.com');
      expect(result.data.metadata.description).toBe('A test resource for unit testing');
    });

    it('should get details for existing resource by kind only', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.metadata.kind).toBe('TestResource');
    });

    it('should get details for resource by short name', async () => {
      const result = await tool.execute({
        resourceType: 'test'
      });

      expect(result.success).toBe(true);
      expect(result.data.metadata.kind).toBe('TestResource');
    });

    it('should return error for non-existent resource', async () => {
      const result = await tool.execute({
        resourceType: 'NonExistentResource'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('resource information', () => {
    it('should include complete resource metadata', async () => {
      const result = await tool.execute({
        resourceType: 'PostgreSQLCluster'
      });

      expect(result.success).toBe(true);
      const resource = result.data.metadata;
      expect(resource.group).toBe('databases.example.com');
      expect(resource.plural).toBe('postgresqlclusters');
      expect(resource.singular).toBe('postgresqlcluster');
      expect(resource.shortNames).toContain('pg');
      expect(resource.scope).toBe('Namespaced');
      expect(resource.versions).toContain('v1');
      expect(resource.category).toBe('database');
    });

    it('should include available samples', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.samples).toBeDefined();
      expect(result.data.samples.length).toBe(1);
      expect(result.data.samples[0].description).toBe('Simple test resource example');
      expect(result.data.samples[0].complexity).toBe('simple');
    });

    it('should include related instructions', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.instructions).toBeDefined();
      expect(result.data.instructions.length).toBe(1);
      expect(result.data.instructions[0].title).toBe('Test Resource Guide');
    });
  });

  describe('include related resources', () => {
    it('should find related resources when includeRelated is true', async () => {
      const result = await tool.execute({
        resourceType: 'PostgreSQLCluster',
        includeRelated: true
      });

      expect(result.success).toBe(true);
      expect(result.data.relatedResources).toBeDefined();
      // Related resources would be found through instructions mentioning other CRDs
    });

    it('should always include related resources field', async () => {
      const result = await tool.execute({
        resourceType: 'PostgreSQLCluster'
      });

      expect(result.success).toBe(true);
      expect(result.data.relatedResources).toBeDefined();
      expect(Array.isArray(result.data.relatedResources)).toBe(true);
    });
  });

  describe('case insensitive search', () => {
    it('should find resource with different case', async () => {
      const result = await tool.execute({
        resourceType: 'testresource'
      });

      expect(result.success).toBe(true);
      expect(result.data.metadata.kind).toBe('TestResource');
    });

    it('should find resource by uppercase short name', async () => {
      const result = await tool.execute({
        resourceType: 'PG'
      });

      expect(result.success).toBe(true);
      expect(result.data.metadata.kind).toBe('PostgreSQLCluster');
    });
  });

  describe('suggestions', () => {
    it('should provide helpful suggestions for valid resource', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.some(s => s.includes('find-samples'))).toBe(true);
      expect(result.suggestions?.some(s => s.includes('get-resource-guidance'))).toBe(true);
    });

    it('should provide similar resources for not found', async () => {
      const result = await tool.execute({
        resourceType: 'TestRes'
      });

      expect(result.success).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.some(s => s.includes('TestResource'))).toBe(true);
    });
  });

  describe('metadata', () => {
    it('should include query metadata', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.samplesAvailable).toBeDefined();
      expect(result.metadata!.instructionsFound).toBeDefined();
    });

    it('should include sample and instruction counts', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.metadata!.samplesAvailable).toBe(1);
      expect(result.metadata!.instructionsFound).toBe(1);
    });
  });

  describe('complex scenarios', () => {
    it('should handle resource with multiple versions', async () => {
      const result = await tool.execute({
        resourceType: 'PostgreSQLCluster'
      });

      expect(result.success).toBe(true);
      expect(result.data.metadata.versions).toContain('v1');
      expect(result.data.metadata.versions).toContain('v1beta1');
      expect(result.data.metadata.versions.length).toBe(2);
    });

    it('should work with resources that have no samples', async () => {
      // Add a CRD with no samples to test data
      testData.crds.set('test.com/NoSampleResource', {
        group: 'test.com',
        kind: 'NoSampleResource',
        plural: 'nosampleresources',
        scope: 'Cluster',
        versions: ['v1'],
        filePath: '/test/no-sample.yaml',
        description: 'Resource without samples',
      });

      const result = await tool.execute({
        resourceType: 'NoSampleResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.samples).toHaveLength(0);
      expect(result.metadata!.samplesAvailable).toBe(0);
    });
  });
});