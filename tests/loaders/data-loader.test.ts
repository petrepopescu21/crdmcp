import { describe, expect, it } from '@jest/globals';
import { loadAllData } from '../../src/loaders/index.js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Data Loading Integration', () => {

  describe('loadAllData', () => {
    it('should load all data types successfully', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      const data = await loadAllData(fixturesDir);

      // Check CRDs loaded
      expect(data.crds).toBeDefined();
      expect(data.crds.size).toBeGreaterThan(0);
      expect(data.crds.has('example.com/TestResource')).toBe(true);

      // Check samples loaded
      expect(data.samples).toBeDefined();
      expect(data.samples.size).toBeGreaterThan(0);
      expect(data.samples.has('TestResource')).toBe(true);

      // Check instructions loaded
      expect(data.instructions).toBeDefined();
      expect(data.instructions.length).toBeGreaterThan(0);

      // Check statistics
      expect(data.statistics).toBeDefined();
      expect(data.statistics.crdsLoaded).toBe(data.crds.size);
      expect(data.statistics.instructionsLoaded).toBe(data.instructions.length);
      expect(data.statistics.loadTime).toBeGreaterThan(0);
    });

    it('should cross-reference CRDs and samples', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      const data = await loadAllData(fixturesDir);

      // Check that samples reference existing CRD kinds
      const testResource = data.crds.get('example.com/TestResource');
      const testSamples = data.samples.get('TestResource');

      expect(testResource).toBeDefined();
      expect(testSamples).toBeDefined();
      expect(testSamples?.length).toBeGreaterThan(0);

      // Verify sample matches CRD
      const sample = testSamples![0];
      expect(sample.kind).toBe(testResource?.kind);
    });

    it('should link instructions to CRDs', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      const data = await loadAllData(fixturesDir);

      // Find instruction that references TestResource
      const testInstruction = data.instructions.find(
        (i) =>
          i.frontmatter.applicableCRDs?.includes('TestResource') ||
          i.detectedCRDs.includes('TestResource')
      );

      expect(testInstruction).toBeDefined();

      // Verify the referenced CRD exists
      const hasMatchingCRD = Array.from(data.crds.values()).some(
        (crd) => crd.kind === 'TestResource'
      );
      expect(hasMatchingCRD).toBe(true);
    });

    it('should handle partial data availability', async () => {
      // Even if some directories are missing, it should still load what's available
      const tempDir = resolve(__dirname, '../temp-fixtures');
      const data = await loadAllData(tempDir);

      expect(data.crds).toBeDefined();
      expect(data.samples).toBeDefined();
      expect(data.instructions).toBeDefined();
      expect(data.statistics).toBeDefined();

      // Should have empty collections but no crashes
      expect(data.crds.size).toBe(0);
      expect(data.samples.size).toBe(0);
      expect(data.instructions.length).toBe(0);
    });

    it('should collect all errors and warnings', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      const data = await loadAllData(fixturesDir);

      expect(data.statistics.errors).toBeDefined();
      expect(Array.isArray(data.statistics.errors)).toBe(true);
      expect(data.statistics.warnings).toBeDefined();
      expect(Array.isArray(data.statistics.warnings)).toBe(true);
    });

    it('should measure load time', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      const data = await loadAllData(fixturesDir);

      expect(data.statistics.loadTime).toBeDefined();
      expect(data.statistics.loadTime).toBeGreaterThan(0);
      expect(data.statistics.loadTime).toBeLessThan(5000); // Should load quickly
    });

    it('should provide accurate statistics', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      const data = await loadAllData(fixturesDir);

      // Count total samples
      let totalSamples = 0;
      data.samples.forEach((samples) => {
        totalSamples += samples.length;
      });

      expect(data.statistics.samplesLoaded).toBe(totalSamples);
      expect(data.statistics.crdsLoaded).toBe(data.crds.size);
      expect(data.statistics.instructionsLoaded).toBe(data.instructions.length);
    });
  });
});