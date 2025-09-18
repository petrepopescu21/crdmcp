import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { SampleLoader } from '../../src/loaders/sample-loader.js';
import { createLogger } from '../../src/utils/logger.js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('SampleLoader', () => {
  let loader: SampleLoader;
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    logger = createLogger(false);
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(logger, 'timing').mockImplementation(() => {});
  });

  describe('loadSamples', () => {
    it('should load valid sample manifests', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new SampleLoader(fixturesDir, logger);

      const result = await loader.loadSamples();

      expect(result.samples.size).toBeGreaterThan(0);
      expect(result.samples.has('TestResource')).toBe(true);

      const testSamples = result.samples.get('TestResource');
      expect(testSamples).toBeDefined();
      expect(testSamples?.length).toBe(1);

      const sample = testSamples![0];
      expect(sample.apiVersion).toBe('example.com/v1');
      expect(sample.kind).toBe('TestResource');
      expect(sample.metadata.name).toBe('sample-test');
      expect(sample.metadata.namespace).toBe('default');
      expect(sample.content.spec.replicas).toBe(3);
      expect(sample.content.spec.enabled).toBe(true);
    });

    it('should extract tags from filename', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new SampleLoader(fixturesDir, logger);

      const result = await loader.loadSamples();
      const testSamples = result.samples.get('TestResource');
      const sample = testSamples![0];

      // test-sample.yaml should have 'testing' tag
      expect(sample.tags).toContain('testing');
    });

    it('should determine complexity correctly', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new SampleLoader(fixturesDir, logger);

      const result = await loader.loadSamples();
      const testSamples = result.samples.get('TestResource');
      const sample = testSamples![0];

      // Simple sample should have 'simple' complexity
      expect(sample.complexity).toBe('simple');
    });

    it('should generate description for samples', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new SampleLoader(fixturesDir, logger);

      const result = await loader.loadSamples();
      const testSamples = result.samples.get('TestResource');
      const sample = testSamples![0];

      expect(sample.description).toBeDefined();
      expect(sample.description).toContain('TestResource');
    });

    it('should handle multiple samples per resource kind', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new SampleLoader(fixturesDir, logger);

      const result = await loader.loadSamples();

      // Check the samples map structure
      result.samples.forEach((samples, kind) => {
        expect(Array.isArray(samples)).toBe(true);
        samples.forEach((sample) => {
          expect(sample.kind).toBe(kind);
        });
      });
    });

    it('should handle missing samples directory gracefully', async () => {
      const nonExistentDir = resolve(__dirname, '../non-existent');
      loader = new SampleLoader(nonExistentDir, logger);

      const result = await loader.loadSamples();

      expect(result.samples.size).toBe(0);
      expect(result.errors.length).toBe(0);
    });

    it('should skip non-Kubernetes manifests', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new SampleLoader(fixturesDir, logger);

      const result = await loader.loadSamples();

      // Should not include the invalid-crd.yaml which is a ConfigMap
      result.samples.forEach((samples) => {
        samples.forEach((sample) => {
          expect(sample.kind).not.toBe('CustomResourceDefinition');
        });
      });
    });

    it('should extract metadata correctly', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new SampleLoader(fixturesDir, logger);

      const result = await loader.loadSamples();
      const testSamples = result.samples.get('TestResource');
      const sample = testSamples![0];

      expect(sample.metadata).toBeDefined();
      expect(sample.metadata.labels).toBeDefined();
      expect(sample.metadata.labels.environment).toBe('test');
      expect(sample.filePath).toContain('test-sample.yaml');
    });
  });
});