import { describe, expect, it, beforeAll } from '@jest/globals';
import { createTestData } from '../tools/test-data-helper.js';
import { ListResourcesTool } from '../../src/tools/list-resources-tool.js';
import { ResourceDetailsTool } from '../../src/tools/resource-details-tool.js';
import { FindSamplesTool } from '../../src/tools/find-samples-tool.js';
import { ResourceGuidanceTool } from '../../src/tools/resource-guidance-tool.js';
import type { LoadedData } from '../../src/types/index.js';

describe('End-to-End User Scenarios', () => {
  let testData: LoadedData;
  let listTool: ListResourcesTool;
  let detailsTool: ResourceDetailsTool;
  let samplesTool: FindSamplesTool;
  let guidanceTool: ResourceGuidanceTool;

  beforeAll(() => {
    testData = createTestData();
    listTool = new ListResourcesTool(testData);
    detailsTool = new ResourceDetailsTool(testData);
    samplesTool = new FindSamplesTool(testData);
    guidanceTool = new ResourceGuidanceTool(testData);
  });

  describe('Scenario 1: New Developer Exploring Available Resources', () => {
    it('should help a developer discover what resources are available', async () => {
      // Step 1: New developer wants to see all available custom resources
      const resourcesResult = await listTool.execute({});

      expect(resourcesResult.success).toBe(true);
      expect(resourcesResult.data.resources).toHaveLength(2);

      // Verify we have TestResource and PostgreSQLCluster
      const resourceTypes = resourcesResult.data.resources.map((r: any) => r.kind);
      expect(resourceTypes).toContain('TestResource');
      expect(resourceTypes).toContain('PostgreSQLCluster');

      // Step 2: Developer wants to see what database resources are available
      const databaseResourcesResult = await listTool.execute({
        category: 'database'
      });

      expect(databaseResourcesResult.success).toBe(true);
      expect(databaseResourcesResult.data.resources).toHaveLength(1);
      expect(databaseResourcesResult.data.resources[0].kind).toBe('PostgreSQLCluster');

      // Step 3: Developer wants detailed information about PostgreSQL
      const detailsResult = await detailsTool.execute({
        resourceType: 'PostgreSQLCluster'
      });

      expect(detailsResult.success).toBe(true);
      expect(detailsResult.data.metadata.kind).toBe('PostgreSQLCluster');
      expect(detailsResult.data.metadata.group).toBe('databases.example.com');
      expect(detailsResult.data.samples).toBeDefined();
      expect(detailsResult.data.instructions).toBeDefined();
    });
  });

  describe('Scenario 2: Developer Creating a New PostgreSQL Database', () => {
    it('should provide complete guidance for creating a PostgreSQL database', async () => {
      // Step 1: Get detailed information about PostgreSQL resources
      const detailsResult = await detailsTool.execute({
        resourceType: 'databases.example.com/PostgreSQLCluster'
      });

      expect(detailsResult.success).toBe(true);
      expect(detailsResult.data.metadata.kind).toBe('PostgreSQLCluster');

      // Step 2: Find sample manifests for PostgreSQL
      const samplesResult = await samplesTool.execute({
        kind: 'PostgreSQLCluster'
      });

      expect(samplesResult.success).toBe(true);
      expect(samplesResult.data.samples).toHaveLength(1);
      expect(samplesResult.data.samples[0].complexity).toBe('intermediate');
      expect(samplesResult.data.samples[0].tags).toContain('production');

      // Step 3: Get specific guidance for production PostgreSQL setup
      const guidanceResult = await guidanceTool.execute({
        resourceType: 'PostgreSQLCluster',
        tags: ['production']
      });

      expect(guidanceResult.success).toBe(true);
      expect(guidanceResult.data.guidance).toHaveLength(1);
      expect(guidanceResult.data.guidance[0].title).toBe('PostgreSQL Cluster Setup');

      // Verify we have everything needed to create a resource
      expect(detailsResult.data.usageExamples).toBeDefined();
      expect(samplesResult.data.samples[0].content).toBeDefined();
      expect(guidanceResult.data.guidance[0].content).toContain('PostgreSQL');
    });
  });

  describe('Scenario 3: Developer Looking for Simple Examples', () => {
    it('should help find simple examples across different resource types', async () => {
      // Step 1: Find all simple complexity samples
      const simpleTestResult = await samplesTool.execute({
        kind: 'TestResource',
        complexity: 'simple'
      });

      expect(simpleTestResult.success).toBe(true);
      expect(simpleTestResult.data.samples).toHaveLength(1);
      expect(simpleTestResult.data.samples[0].complexity).toBe('simple');

      // Step 2: Get guidance for beginners
      const beginnerGuidanceResult = await guidanceTool.execute({
        tags: ['guide']
      });

      expect(beginnerGuidanceResult.success).toBe(true);
      expect(beginnerGuidanceResult.data.guidance.length).toBeGreaterThan(0);

      // Step 3: Verify the guidance includes helpful information
      const instruction = beginnerGuidanceResult.data.guidance[0];
      expect(instruction.content).toContain('guide');
      expect(instruction.tags).toContain('guide');
    });
  });

  describe('Scenario 4: Developer Troubleshooting Resource Issues', () => {
    it('should provide helpful suggestions when resources are not found', async () => {
      // Step 1: Developer searches for a resource that doesn't exist
      const notFoundResult = await detailsTool.execute({
        resourceType: 'NonExistentResource'
      });

      expect(notFoundResult.success).toBe(false);
      expect(notFoundResult.error).toContain('not found');
      expect(notFoundResult.suggestions).toBeDefined();
      expect(notFoundResult.suggestions!.length).toBeGreaterThan(0);

      // Step 2: Developer tries to find samples for non-existent resource
      const noSamplesResult = await samplesTool.execute({
        kind: 'NonExistentResource'
      });

      expect(noSamplesResult.success).toBe(false);
      expect(noSamplesResult.error).toContain('No samples found');
      expect(noSamplesResult.suggestions).toBeDefined();

      // Step 3: Developer gets general guidance when specific resource isn't available
      const generalGuidanceResult = await guidanceTool.execute({
        resourceType: 'NonExistentResource'
      });

      expect(generalGuidanceResult.success).toBe(false);
      expect(generalGuidanceResult.suggestions).toBeDefined();
      expect(generalGuidanceResult.suggestions!.some(s => s.includes('Available tags'))).toBe(true);
    });
  });

  describe('Scenario 5: Cross-Tool Workflow Consistency', () => {
    it('should maintain consistent data across different tools', async () => {
      // Step 1: List resources to see what's available
      const listResult = await listTool.execute({});
      expect(listResult.success).toBe(true);

      const testResource = listResult.data.resources.find((r: any) => r.kind === 'TestResource');
      expect(testResource).toBeDefined();

      // Step 2: Get details for the same resource
      const detailsResult = await detailsTool.execute({
        resourceType: 'TestResource'
      });
      expect(detailsResult.success).toBe(true);

      // Step 3: Verify consistency between list and details
      expect(detailsResult.data.metadata.kind).toBe(testResource.kind);
      expect(detailsResult.data.metadata.group).toBe(testResource.group);
      expect(detailsResult.data.metadata.description).toBe(testResource.description);

      // Step 4: Find samples and verify they match the resource
      const samplesResult = await samplesTool.execute({
        kind: 'TestResource'
      });
      expect(samplesResult.success).toBe(true);

      // Verify sample content matches the resource kind
      expect(samplesResult.data.samples[0].content.kind).toBe('TestResource');
      expect(samplesResult.data.samples[0].content.apiVersion).toBe('example.com/v1');

      // Step 5: Get guidance and verify it's relevant
      const guidanceResult = await guidanceTool.execute({
        resourceType: 'TestResource'
      });
      expect(guidanceResult.success).toBe(true);
      expect(guidanceResult.data.guidance[0].title).toContain('Test Resource');
    });
  });

  describe('Scenario 6: Advanced Resource Discovery', () => {
    it('should support advanced discovery patterns', async () => {
      // Step 1: Find resources by short name
      const shortNameResult = await detailsTool.execute({
        resourceType: 'test'  // Short name for TestResource
      });

      expect(shortNameResult.success).toBe(true);
      expect(shortNameResult.data.metadata.kind).toBe('TestResource');

      // Step 2: Case-insensitive search
      const caseInsensitiveResult = await detailsTool.execute({
        resourceType: 'TESTRESOURCE'
      });

      expect(caseInsensitiveResult.success).toBe(true);
      expect(caseInsensitiveResult.data.metadata.kind).toBe('TestResource');

      // Step 3: Search by category
      const serviceResourcesResult = await listTool.execute({
        category: 'service'
      });

      expect(serviceResourcesResult.success).toBe(true);
      expect(serviceResourcesResult.data.resources.some((r: any) => r.kind === 'TestResource')).toBe(true);

      // Step 4: Complex sample filtering
      const taggedSamplesResult = await samplesTool.execute({
        kind: 'TestResource',
        tags: ['simple', 'test']
      });

      expect(taggedSamplesResult.success).toBe(true);
      expect(taggedSamplesResult.data.samples[0].tags).toContain('simple');
      expect(taggedSamplesResult.data.samples[0].tags).toContain('test');
    });
  });

  describe('Scenario 7: Complete Resource Creation Workflow', () => {
    it('should provide all information needed to create a resource', async () => {
      const resourceType = 'PostgreSQLCluster';

      // Step 1: Get comprehensive resource details
      const detailsResult = await detailsTool.execute({
        resourceType
      });

      expect(detailsResult.success).toBe(true);

      // Verify we have all necessary information
      expect(detailsResult.data.metadata.kind).toBe(resourceType);
      expect(detailsResult.data.metadata.group).toBe('databases.example.com');
      expect(detailsResult.data.metadata.versions).toContain('v1');
      expect(detailsResult.data.metadata.scope).toBe('Namespaced');

      // Step 2: Get samples for reference
      expect(detailsResult.data.samples).toHaveLength(1);
      const sample = detailsResult.data.samples[0];
      expect(sample.content.apiVersion).toBe('databases.example.com/v1');
      expect(sample.content.kind).toBe(resourceType);
      expect(sample.content.metadata).toBeDefined();
      expect(sample.content.spec).toBeDefined();

      // Step 3: Get usage examples
      expect(detailsResult.data.usageExamples).toBeDefined();
      expect(detailsResult.data.usageExamples.length).toBeGreaterThan(0);

      const usageExample = detailsResult.data.usageExamples[0];
      expect(usageExample.apiVersion).toBe('databases.example.com/v1');
      expect(usageExample.kind).toBe(resourceType);
      expect(usageExample.example.metadata).toBeDefined();

      // Step 4: Get instructions
      expect(detailsResult.data.instructions).toHaveLength(1);
      expect(detailsResult.data.instructions[0].content).toContain('PostgreSQL');

      // Step 5: Verify suggestions for next steps
      expect(detailsResult.suggestions).toBeDefined();
      expect(detailsResult.suggestions!.some(s => s.includes('find-samples'))).toBe(true);
      expect(detailsResult.suggestions!.some(s => s.includes('get-resource-guidance'))).toBe(true);
    });
  });
});