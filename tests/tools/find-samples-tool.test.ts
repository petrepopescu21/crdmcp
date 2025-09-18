import { describe, expect, it } from '@jest/globals';
import { FindSamplesTool } from '../../src/tools/find-samples-tool.js';
import { createTestData } from './test-data-helper.js';

describe('FindSamplesTool', () => {
  let tool: FindSamplesTool;
  let testData: ReturnType<typeof createTestData>;

  beforeEach(() => {
    testData = createTestData();
    tool = new FindSamplesTool(testData);
  });

  describe('basic functionality', () => {
    it('should have correct name and description', () => {
      expect(tool.name).toBe('find-samples');
      expect(tool.description).toContain('sample manifests');
    });

    it('should have proper input schema', () => {
      const schema = tool.inputSchema;
      expect(schema).toBeDefined();
      expect(schema.kind).toBeDefined();
      expect(schema.complexity).toBeDefined();
      expect(schema.tags).toBeDefined();
      expect(schema.includeContent).toBeDefined();
    });
  });

  describe('find samples by resource type', () => {
    it('should find samples for existing resource type', async () => {
      const result = await tool.execute({
        kind: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.samples).toHaveLength(1);
      expect(result.data.kind).toBe('TestResource');
      expect(result.data.samples[0].description).toBe('Simple test resource example');
    });

    it('should find samples for PostgreSQL resource', async () => {
      const result = await tool.execute({
        kind: 'PostgreSQLCluster'
      });

      expect(result.success).toBe(true);
      expect(result.data.samples).toHaveLength(1);
      expect(result.data.kind).toBe('PostgreSQLCluster');
      expect(result.data.samples[0].description).toBe('Production PostgreSQL cluster');
    });

    it('should return error for wrong case', async () => {
      const result = await tool.execute({
        kind: 'testresource' // Wrong case, should fail
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No samples found');
    });

    it('should return error for non-existent resource type', async () => {
      const result = await tool.execute({
        kind: 'NonExistentResource'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No samples found');
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('filter by complexity', () => {
    it('should filter samples by simple complexity', async () => {
      const result = await tool.execute({
        kind: 'TestResource',
        complexity: 'simple'
      });

      expect(result.success).toBe(true);
      expect(result.data.samples).toHaveLength(1);
      expect(result.data.samples[0].complexity).toBe('simple');
    });

    it('should filter samples by intermediate complexity', async () => {
      const result = await tool.execute({
        kind: 'PostgreSQLCluster',
        complexity: 'intermediate'
      });

      expect(result.success).toBe(true);
      expect(result.data.samples).toHaveLength(1);
      expect(result.data.samples[0].complexity).toBe('intermediate');
    });

    it('should return empty when complexity doesnt match', async () => {
      const result = await tool.execute({
        kind: 'TestResource',
        complexity: 'advanced' // TestResource sample is simple
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No samples found');
    });
  });

  describe('filter by tags', () => {
    it('should filter samples by single tag', async () => {
      const result = await tool.execute({
        kind: 'TestResource',
        tags: ['simple']
      });

      expect(result.success).toBe(true);
      expect(result.data.samples).toHaveLength(1);
      expect(result.data.samples[0].tags).toContain('simple');
    });

    it('should filter samples by multiple tags', async () => {
      const result = await tool.execute({
        kind: 'PostgreSQLCluster',
        tags: ['production', 'database']
      });

      expect(result.success).toBe(true);
      expect(result.data.samples).toHaveLength(1);
      expect(result.data.samples[0].tags).toContain('production');
      expect(result.data.samples[0].tags).toContain('database');
    });

    it('should return empty when tags dont match', async () => {
      const result = await tool.execute({
        kind: 'TestResource',
        tags: ['production'] // TestResource sample has test tags
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No samples found');
    });
  });

  describe('combined filters', () => {
    it('should apply multiple filters together', async () => {
      const result = await tool.execute({
        kind: 'PostgreSQLCluster',
        complexity: 'intermediate',
        tags: ['production']
      });

      expect(result.success).toBe(true);
      expect(result.data.samples).toHaveLength(1);
      expect(result.data.samples[0].complexity).toBe('intermediate');
      expect(result.data.samples[0].tags).toContain('production');
    });

    it('should return empty when filters dont all match', async () => {
      const result = await tool.execute({
        kind: 'TestResource',
        complexity: 'simple',
        tags: ['production'] // TestResource doesnt have production tag
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No samples found');
    });
  });

  describe('limit parameter', () => {
    it('should respect limit parameter', async () => {
      const result = await tool.execute({
        kind: 'TestResource',
        limit: 1
      });

      expect(result.success).toBe(true);
      expect(result.data.samples.length).toBeLessThanOrEqual(1);
    });

    it('should use default limit when not specified', async () => {
      const result = await tool.execute({
        kind: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.totalSamples).toBeLessThanOrEqual(10); // Default limit
    });
  });

  describe('sample content', () => {
    it('should include complete sample information', async () => {
      const result = await tool.execute({
        kind: 'TestResource'
      });

      expect(result.success).toBe(true);
      const sample = result.data.samples[0];
      expect(sample.apiVersion).toBe('example.com/v1');
      expect(sample.metadata.name).toBe('test-sample');
      expect(sample.content).toBeDefined();
      expect(sample.filePath).toBeDefined();
      expect(sample.description).toBeDefined();
      expect(sample.tags).toBeDefined();
      expect(sample.complexity).toBeDefined();
    });

    it('should include actual manifest content', async () => {
      const result = await tool.execute({
        kind: 'TestResource'
      });

      expect(result.success).toBe(true);
      const sample = result.data.samples[0];
      expect(sample.content).toBeDefined();
      expect(sample.content.spec.replicas).toBe(3);
      expect(sample.content.spec.enabled).toBe(true);
    });
  });

  describe('result metadata', () => {
    it('should include search criteria and counts', async () => {
      const result = await tool.execute({
        kind: 'TestResource',
        complexity: 'simple'
      });

      expect(result.success).toBe(true);
      expect(result.data.kind).toBe('TestResource');
      expect(result.data.filteredCount).toBe(1);
      expect(result.data.totalSamples).toBe(1);
    });

    it('should include available complexities and tags', async () => {
      const result = await tool.execute({
        kind: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.availableComplexities).toBeDefined();
      expect(result.data.availableTags).toBeDefined();
      expect(result.data.availableComplexities).toContain('simple');
    });
  });

  describe('suggestions', () => {
    it('should provide helpful suggestions for valid queries', async () => {
      const result = await tool.execute({
        kind: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
    });

    it('should provide alternative suggestions for no results', async () => {
      const result = await tool.execute({
        kind: 'NonExistent'
      });

      expect(result.success).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
    });

    it('should suggest trying different complexity levels', async () => {
      const result = await tool.execute({
        kind: 'TestResource',
        complexity: 'advanced'
      });

      expect(result.success).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
    });
  });

  describe('sorting and ordering', () => {
    it('should sort samples by complexity (simple first)', async () => {
      // Add multiple samples with different complexities
      const advancedSample = {
        content: { apiVersion: 'example.com/v1', kind: 'TestResource' },
        apiVersion: 'example.com/v1',
        kind: 'TestResource',
        metadata: { name: 'advanced-test' },
        filePath: '/test/advanced.yaml',
        description: 'Advanced test sample',
        tags: ['test', 'advanced'],
        complexity: 'advanced' as const,
      };

      testData.samples.get('TestResource')?.push(advancedSample);

      const result = await tool.execute({
        kind: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.samples).toHaveLength(2);
      // Simple should come before advanced
      expect(result.data.samples[0].complexity).toBe('simple');
      expect(result.data.samples[1].complexity).toBe('advanced');
    });
  });

  describe('error handling', () => {
    it('should handle missing kind parameter', async () => {
      const result = await tool.execute({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('kind is required');
    });

    it('should handle resource type with no samples', async () => {
      // Add a resource with no samples
      testData.samples.set('NoSampleResource', []);

      const result = await tool.execute({
        kind: 'NoSampleResource'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No samples found');
    });
  });

  describe('metadata', () => {
    it('should include query metadata', async () => {
      const result = await tool.execute({
        kind: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.filtersApplied).toBeDefined();
    });
  });
});