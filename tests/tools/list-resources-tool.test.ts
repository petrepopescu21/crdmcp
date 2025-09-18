import { describe, expect, it } from '@jest/globals';
import { ListResourcesTool } from '../../src/tools/list-resources-tool.js';
import { createTestData } from './test-data-helper.js';

describe('ListResourcesTool', () => {
  let tool: ListResourcesTool;
  let testData: ReturnType<typeof createTestData>;

  beforeEach(() => {
    testData = createTestData();
    tool = new ListResourcesTool(testData);
  });

  describe('basic functionality', () => {
    it('should have correct name and description', () => {
      expect(tool.name).toBe('list-available-resources');
      expect(tool.description).toContain('available custom resources');
    });

    it('should have proper input schema', () => {
      const schema = tool.inputSchema;
      expect(schema).toBeDefined();
      expect(schema.category).toBeDefined();
      expect(schema.search).toBeDefined();
      expect(schema.group).toBeDefined();
      expect(schema.scope).toBeDefined();
    });
  });

  describe('list all resources', () => {
    it('should list all resources when no filters provided', async () => {
      const result = await tool.execute({});

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.resources).toHaveLength(2);
      expect(result.data.totalCount).toBe(2);

      const resourceTypes = result.data.resources.map((r: any) => r.kind);
      expect(resourceTypes).toContain('TestResource');
      expect(resourceTypes).toContain('PostgreSQLCluster');
    });

    it('should include correct resource metadata', async () => {
      const result = await tool.execute({});

      const testResource = result.data.resources.find((r: any) => r.kind === 'TestResource');
      expect(testResource).toBeDefined();
      expect(testResource.group).toBe('example.com');
      expect(testResource.plural).toBe('testresources');
      expect(testResource.scope).toBe('Namespaced');
      expect(testResource.shortNames).toContain('test');
      expect(testResource.category).toBe('service');
    });
  });

  describe('filtering by category', () => {
    it('should filter resources by category', async () => {
      const result = await tool.execute({ category: 'database' });

      expect(result.success).toBe(true);
      expect(result.data.resources).toHaveLength(1);
      expect(result.data.resources[0].kind).toBe('PostgreSQLCluster');
      expect(result.metadata?.filterApplied.category).toBe('database');
    });

    it('should return error when category has no matches', async () => {
      const result = await tool.execute({ category: 'nonexistent' as any });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No resources found');
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('filtering by search', () => {
    it('should filter resources by search term in kind', async () => {
      const result = await tool.execute({ search: 'postgres' });

      expect(result.success).toBe(true);
      expect(result.data.resources).toHaveLength(1);
      expect(result.data.resources[0].kind).toBe('PostgreSQLCluster');
    });

    it('should filter resources by search term in description', async () => {
      const result = await tool.execute({ search: 'testing' });

      expect(result.success).toBe(true);
      expect(result.data.resources).toHaveLength(1);
      expect(result.data.resources[0].kind).toBe('TestResource');
    });

    it('should be case insensitive', async () => {
      const result = await tool.execute({ search: 'TEST' });

      expect(result.success).toBe(true);
      expect(result.data.resources).toHaveLength(1);
      expect(result.data.resources[0].kind).toBe('TestResource');
    });
  });

  describe('filtering by group', () => {
    it('should filter resources by group', async () => {
      const result = await tool.execute({ group: 'databases.example.com' });

      expect(result.success).toBe(true);
      expect(result.data.resources).toHaveLength(1);
      expect(result.data.resources[0].group).toBe('databases.example.com');
    });
  });

  describe('filtering by scope', () => {
    it('should filter resources by scope', async () => {
      const result = await tool.execute({ scope: 'Namespaced' });

      expect(result.success).toBe(true);
      expect(result.data.resources).toHaveLength(2); // Both test resources are namespaced
    });
  });

  describe('combined filters', () => {
    it('should apply multiple filters together', async () => {
      const result = await tool.execute({
        category: 'database',
        scope: 'Namespaced'
      });

      expect(result.success).toBe(true);
      expect(result.data.resources).toHaveLength(1);
      expect(result.data.resources[0].kind).toBe('PostgreSQLCluster');
    });

    it('should return error when combined filters have no matches', async () => {
      const result = await tool.execute({
        category: 'database',
        group: 'example.com' // Database resource is in different group
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No resources found');
    });
  });

  describe('suggestions', () => {
    it('should provide helpful suggestions', async () => {
      const result = await tool.execute({});

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
      expect(result.suggestions?.some(s => s.includes('get-resource-details'))).toBe(true);
    });

    it('should include category-specific suggestions', async () => {
      const result = await tool.execute({ category: 'database' });

      expect(result.suggestions?.some(s => s.includes('database'))).toBe(true);
    });
  });

  describe('metadata', () => {
    it('should include search metadata', async () => {
      const result = await tool.execute({ search: 'test' });

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.filterApplied).toBeDefined();
      expect(result.metadata?.filterApplied.search).toBe('test');
    });

    it('should include category statistics', async () => {
      const result = await tool.execute({});

      expect(result.data.categories).toBeDefined();
      expect(result.data.categories.database).toBe(1);
      expect(result.data.categories.service).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle invalid category gracefully', async () => {
      const result = await tool.execute({ category: 'invalid-category' as any });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No resources found');
    });

    it('should handle invalid scope gracefully', async () => {
      const result = await tool.execute({ scope: 'InvalidScope' as any });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No resources found');
    });
  });
});