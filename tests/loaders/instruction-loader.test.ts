import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { InstructionLoader } from '../../src/loaders/instruction-loader.js';
import { createLogger } from '../../src/utils/logger.js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('InstructionLoader', () => {
  let loader: InstructionLoader;
  let logger: ReturnType<typeof createLogger>;

  beforeEach(() => {
    logger = createLogger(false);
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(logger, 'timing').mockImplementation(() => {});
  });

  describe('loadInstructions', () => {
    it('should load instruction documents with frontmatter', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new InstructionLoader(fixturesDir, logger);

      const result = await loader.loadInstructions();

      expect(result.instructions.length).toBeGreaterThan(0);

      const testGuide = result.instructions.find((i) =>
        i.title.includes('Test Resource Usage Guide')
      );
      expect(testGuide).toBeDefined();
      expect(testGuide?.frontmatter.title).toBe('Test Resource Usage Guide');
      expect(testGuide?.frontmatter.applicableCRDs).toContain('TestResource');
      expect(testGuide?.frontmatter.tags).toContain('testing');
      expect(testGuide?.frontmatter.category).toBe('service');
      expect(testGuide?.frontmatter.priority).toBe(10);
    });

    it('should extract content without frontmatter', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new InstructionLoader(fixturesDir, logger);

      const result = await loader.loadInstructions();

      const testGuide = result.instructions.find((i) =>
        i.title.includes('Test Resource Usage Guide')
      );
      expect(testGuide?.content).toContain('# Test Resource Usage Guide');
      expect(testGuide?.content).toContain('## Basic Configuration');
      expect(testGuide?.content).toContain('## Best Practices');
    });

    it('should detect applicable CRDs from content', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new InstructionLoader(fixturesDir, logger);

      const result = await loader.loadInstructions();

      const testGuide = result.instructions.find((i) =>
        i.title.includes('Test Resource Usage Guide')
      );
      expect(testGuide?.detectedCRDs).toBeDefined();
      expect(testGuide?.detectedCRDs).toContain('testresource');
    });

    it('should extract tags from multiple sources', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new InstructionLoader(fixturesDir, logger);

      const result = await loader.loadInstructions();

      const testGuide = result.instructions.find((i) =>
        i.title.includes('Test Resource Usage Guide')
      );
      expect(testGuide?.tags).toBeDefined();
      expect(testGuide?.tags).toContain('testing');
      expect(testGuide?.tags).toContain('example');
      expect(testGuide?.tags).toContain('service'); // From category in frontmatter
      expect(testGuide?.tags).toContain('test'); // From filename
    });

    it('should handle missing instructions directory gracefully', async () => {
      const nonExistentDir = resolve(__dirname, '../non-existent');
      loader = new InstructionLoader(nonExistentDir, logger);

      const result = await loader.loadInstructions();

      expect(result.instructions.length).toBe(0);
      expect(result.errors.length).toBe(0);
    });

    it('should process multiple file formats', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new InstructionLoader(fixturesDir, logger);

      const result = await loader.loadInstructions();

      // The glob pattern includes .md, .txt, and .markdown
      result.instructions.forEach((instruction) => {
        expect(instruction.filePath).toMatch(/\.(md|txt|markdown)$/);
      });
    });

    it('should include file path for each instruction', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new InstructionLoader(fixturesDir, logger);

      const result = await loader.loadInstructions();

      result.instructions.forEach((instruction) => {
        expect(instruction.filePath).toBeDefined();
        expect(instruction.filePath).toContain('instructions');
      });
    });

    it('should generate title from content if not in frontmatter', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new InstructionLoader(fixturesDir, logger);

      const result = await loader.loadInstructions();

      result.instructions.forEach((instruction) => {
        expect(instruction.title).toBeDefined();
        expect(instruction.title.length).toBeGreaterThan(0);
      });
    });

    it('should handle errors gracefully', async () => {
      const fixturesDir = resolve(__dirname, '../fixtures');
      loader = new InstructionLoader(fixturesDir, logger);

      const result = await loader.loadInstructions();

      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});