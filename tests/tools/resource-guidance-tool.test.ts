import { describe, expect, it } from '@jest/globals';
import { ResourceGuidanceTool } from '../../src/tools/resource-guidance-tool.js';
import { createTestData } from './test-data-helper.js';

describe('ResourceGuidanceTool', () => {
  let tool: ResourceGuidanceTool;
  let testData: ReturnType<typeof createTestData>;

  beforeEach(() => {
    testData = createTestData();
    tool = new ResourceGuidanceTool(testData);
  });

  describe('basic functionality', () => {
    it('should have correct name and description', () => {
      expect(tool.name).toBe('get-resource-guidance');
      expect(tool.description).toContain('instructions and guidance');
    });

    it('should have proper input schema', () => {
      const schema = tool.inputSchema;
      expect(schema).toBeDefined();
      expect(schema.resourceType).toBeDefined();
      expect(schema.category).toBeDefined();
      expect(schema.tags).toBeDefined();
      expect(schema.limit).toBeDefined();
    });
  });

  describe('input validation', () => {
    it('should require at least one parameter', async () => {
      const result = await tool.execute({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('At least one of');
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('guidance by resource type', () => {
    it('should find guidance for specific resource type', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.guidance).toHaveLength(1);
      expect(result.data.guidance[0].title).toBe('Test Resource Guide');
      expect(result.data.guidance[0].applicableCRDs).toContain('TestResource');
    });

    it('should find guidance for PostgreSQL resource', async () => {
      const result = await tool.execute({
        resourceType: 'PostgreSQLCluster'
      });

      expect(result.success).toBe(true);
      expect(result.data.guidance).toHaveLength(1);
      expect(result.data.guidance[0].title).toBe('PostgreSQL Cluster Setup');
    });

    it('should be case insensitive for resource type', async () => {
      const result = await tool.execute({
        resourceType: 'testresource'
      });

      expect(result.success).toBe(true);
      expect(result.data.guidance).toHaveLength(1);
    });

    it('should return empty for non-existent resource type', async () => {
      const result = await tool.execute({
        resourceType: 'NonExistentResource'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No guidance documents found');
    });
  });

  describe('guidance by category', () => {
    it('should find guidance for database category', async () => {
      const result = await tool.execute({
        category: 'database'
      });

      expect(result.success).toBe(true);
      expect(result.data.guidance).toHaveLength(1);
      expect(result.data.guidance[0].category).toBe('database');
    });

    it('should find guidance for service category', async () => {
      const result = await tool.execute({
        category: 'service'
      });

      expect(result.success).toBe(true);
      expect(result.data.guidance).toHaveLength(1);
      expect(result.data.guidance[0].category).toBe('service');
    });
  });

  describe('guidance by tags', () => {
    it('should find guidance by single tag', async () => {
      const result = await tool.execute({
        tags: ['testing']
      });

      expect(result.success).toBe(true);
      expect(result.data.guidance).toHaveLength(1);
      expect(result.data.guidance[0].tags).toContain('testing');
    });

    it('should find guidance by multiple tags', async () => {
      const result = await tool.execute({
        tags: ['database', 'production']
      });

      expect(result.success).toBe(true);
      expect(result.data.guidance).toHaveLength(1);
      expect(result.data.guidance[0].tags).toContain('database');
      expect(result.data.guidance[0].tags).toContain('production');
    });

    it('should return empty for non-matching tags', async () => {
      const result = await tool.execute({
        tags: ['nonexistent']
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No guidance documents found');
    });
  });

  describe('combined filters', () => {
    it('should apply resource type and category together', async () => {
      const result = await tool.execute({
        resourceType: 'PostgreSQLCluster',
        category: 'database'
      });

      expect(result.success).toBe(true);
      expect(result.data.guidance).toHaveLength(1);
      expect(result.data.guidance[0].title).toBe('PostgreSQL Cluster Setup');
    });

    it('should return empty when filters dont match', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource',
        category: 'database' // TestResource is service category
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No guidance documents found');
    });
  });

  describe('limit parameter', () => {
    it('should respect limit parameter', async () => {
      const result = await tool.execute({
        tags: ['guide'],
        limit: 1
      });

      expect(result.success).toBe(true);
      expect(result.data.guidance.length).toBeLessThanOrEqual(1);
    });

    it('should use default limit when not specified', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.guidanceCount).toBeLessThanOrEqual(10); // Default limit
    });
  });

  describe('result structure', () => {
    it('should include complete guidance information', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      const guidance = result.data.guidance[0];
      expect(guidance.title).toBeDefined();
      expect(guidance.content).toBeDefined();
      expect(guidance.tags).toBeDefined();
      expect(guidance.applicableCRDs).toBeDefined();
      expect(guidance.category).toBeDefined();
      expect(guidance.priority).toBeDefined();
      expect(guidance.filePath).toBeDefined();
    });

    it('should include metadata and counts', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.criteria).toBeDefined();
      expect(result.data.guidanceCount).toBe(1);
      expect(result.data.totalAvailable).toBe(2); // Total instructions in test data
    });

    it('should include related resources', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.relatedResources).toBeDefined();
      expect(Array.isArray(result.data.relatedResources)).toBe(true);
    });

    it('should include best practices', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.bestPractices).toBeDefined();
      expect(Array.isArray(result.data.bestPractices)).toBe(true);
    });
  });

  describe('priority ordering', () => {
    it('should order results by priority', async () => {
      // Add another instruction with different priority
      const lowPriorityInstruction = {
        title: 'Low Priority Guide',
        content: 'Low priority content',
        filePath: '/test/low-priority.md',
        frontmatter: {
          title: 'Low Priority Guide',
          applicableCRDs: ['TestResource'],
          tags: ['testing'],
          category: 'service',
          priority: 1, // Lower than test instruction (5)
        },
        detectedCRDs: ['testresource'],
        tags: ['testing', 'service'],
      };

      testData.instructions.push(lowPriorityInstruction as any);

      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.data.guidance).toHaveLength(2);
      // Higher priority should come first
      expect(result.data.guidance[0].priority).toBeGreaterThan(result.data.guidance[1].priority);
    });
  });

  describe('suggestions', () => {
    it('should provide helpful suggestions for valid queries', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource'
      });

      expect(result.success).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.some(s => s.includes('find-samples'))).toBe(true);
      expect(result.suggestions?.some(s => s.includes('get-resource-details'))).toBe(true);
    });

    it('should provide alternative suggestions for no results', async () => {
      const result = await tool.execute({
        resourceType: 'NonExistent'
      });

      expect(result.success).toBe(false);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.some(s => s.includes('similar resources'))).toBe(true);
    });
  });

  describe('metadata', () => {
    it('should include search criteria in metadata', async () => {
      const result = await tool.execute({
        resourceType: 'TestResource',
        category: 'service'
      });

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.searchCriteria.resourceType).toBe('TestResource');
      expect(result.metadata?.searchCriteria.category).toBe('service');
    });
  });
});