import { readFileSync } from 'fs';
import { glob } from 'glob';
import { resolve, basename } from 'path';
import matter from 'gray-matter';
import type { InstructionDocument } from '../types/index.js';
import {
  extractTagsFromContent,
  generateDescription,
} from '../utils/helpers.js';
import type { Logger } from '../utils/logger.js';

export class InstructionLoader {
  constructor(
    private dataDir: string,
    private logger: Logger
  ) {}

  async loadInstructions(): Promise<{
    instructions: InstructionDocument[];
    errors: string[];
    warnings: string[];
  }> {
    const startTime = Date.now();
    const instructions: InstructionDocument[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const instructionDir = resolve(this.dataDir, 'instructions');
    this.logger.debug(`Loading instructions from: ${instructionDir}`);

    try {
      // Find all markdown and text files recursively
      const files = await glob('**/*.{md,txt,markdown}', {
        cwd: instructionDir,
        nodir: true,
        absolute: true,
      });

      this.logger.debug(`Found ${files.length} instruction files to process`);

      for (const filePath of files) {
        try {
          const fileContent = readFileSync(filePath, 'utf8');
          const instruction = this.createInstructionDocument(
            fileContent,
            filePath
          );

          instructions.push(instruction);
          this.logger.debug(
            `Loaded instruction: ${instruction.title} from ${filePath}`
          );
        } catch (error) {
          errors.push(
            `Failed to read instruction file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    } catch (error) {
      errors.push(
        `Failed to scan instructions directory: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    this.logger.timing('Instruction loading', startTime);
    this.logger.info(`Loaded ${instructions.length} instruction documents`);

    if (errors.length > 0) {
      this.logger.warn(`Instruction loading had ${errors.length} errors`);
    }

    return { instructions, errors, warnings };
  }

  private createInstructionDocument(
    fileContent: string,
    filePath: string
  ): InstructionDocument {
    const fileName = basename(filePath);

    // Parse frontmatter if present
    const { data: frontmatter, content } = matter(fileContent);

    // Extract title
    const title = this.extractTitle(frontmatter, content, fileName);

    // Extract tags from frontmatter and content
    const tags = this.extractTags(frontmatter, content, fileName);

    // Detect applicable CRDs from content
    const detectedCRDs = this.detectApplicableCRDs(content);

    return {
      title,
      content,
      filePath,
      frontmatter,
      detectedCRDs,
      tags,
    };
  }

  private extractTitle(
    frontmatter: any,
    content: string,
    fileName: string
  ): string {
    // Try frontmatter title first
    if (frontmatter.title && typeof frontmatter.title === 'string') {
      return frontmatter.title;
    }

    // Try first heading in content
    const lines = content.split('\n');
    for (const line of lines.slice(0, 10)) {
      // Check first 10 lines
      const heading = line.match(/^#\s+(.+)$/);
      if (heading) {
        return heading[1].trim();
      }
    }

    // Generate from filename
    return generateDescription(fileName);
  }

  private extractTags(
    frontmatter: any,
    content: string,
    fileName: string
  ): string[] {
    const tags: Set<string> = new Set();

    // Add tags from frontmatter
    if (Array.isArray(frontmatter.tags)) {
      frontmatter.tags.forEach((tag: any) => {
        if (typeof tag === 'string') {
          tags.add(tag.toLowerCase());
        }
      });
    }

    // Add category as tag
    if (frontmatter.category && typeof frontmatter.category === 'string') {
      tags.add(frontmatter.category.toLowerCase());
    }

    // Extract tags from content
    const contentTags = extractTagsFromContent(content);
    contentTags.forEach((tag) => tags.add(tag));

    // Add filename-based tags
    const fileBaseName = fileName.replace(/\.(md|txt|markdown)$/i, '');
    const fileWords = fileBaseName
      .split(/[-_\s]+/)
      .filter((word) => word.length > 2)
      .map((word) => word.toLowerCase());

    fileWords.forEach((word) => {
      if (this.isValidTag(word)) {
        tags.add(word);
      }
    });

    return Array.from(tags);
  }

  private isValidTag(word: string): boolean {
    const skipWords = new Set([
      'the',
      'and',
      'for',
      'with',
      'how',
      'guide',
      'docs',
      'documentation',
      'example',
      'sample',
      'template',
      'readme',
      'instructions',
    ]);

    return !skipWords.has(word.toLowerCase());
  }

  private detectApplicableCRDs(content: string): string[] {
    const crds: Set<string> = new Set();
    const lowerContent = content.toLowerCase();

    // Common CRD patterns to detect
    const crdPatterns = [
      // Database patterns
      { pattern: /redis/gi, crd: 'redis' },
      { pattern: /postgres|postgresql/gi, crd: 'postgresql' },
      { pattern: /mysql/gi, crd: 'mysql' },
      { pattern: /mongodb|mongo/gi, crd: 'mongodb' },

      // Messaging patterns
      { pattern: /kafka/gi, crd: 'kafka' },
      { pattern: /rabbitmq|rabbit/gi, crd: 'rabbitmq' },
      { pattern: /queue/gi, crd: 'queue' },

      // Service patterns
      { pattern: /service/gi, crd: 'service' },
      { pattern: /api.*gateway|gateway/gi, crd: 'gateway' },
      { pattern: /ingress/gi, crd: 'ingress' },

      // Storage patterns
      { pattern: /storage/gi, crd: 'storage' },
      { pattern: /volume/gi, crd: 'volume' },
      { pattern: /bucket/gi, crd: 'bucket' },

      // Security patterns
      { pattern: /rbac/gi, crd: 'rbac' },
      { pattern: /policy/gi, crd: 'policy' },
      { pattern: /certificate|cert/gi, crd: 'certificate' },
    ];

    for (const { pattern, crd } of crdPatterns) {
      if (pattern.test(lowerContent)) {
        crds.add(crd);
      }
    }

    // Look for explicit apiVersion/kind references
    const apiVersionMatches = content.matchAll(/apiVersion:\s*([^\s]+)/gi);
    for (const match of apiVersionMatches) {
      const apiVersion = match[1];
      if (
        apiVersion &&
        !apiVersion.startsWith('v1') &&
        !apiVersion.startsWith('apps/')
      ) {
        // Likely a custom resource
        const group = apiVersion.split('/')[0];
        if (group && group !== 'v1') {
          crds.add(group);
        }
      }
    }

    const kindMatches = content.matchAll(/kind:\s*([^\s]+)/gi);
    for (const match of kindMatches) {
      const kind = match[1];
      if (kind && !this.isStandardKubernetesKind(kind)) {
        crds.add(kind.toLowerCase());
      }
    }

    return Array.from(crds);
  }

  private isStandardKubernetesKind(kind: string): boolean {
    const standardKinds = new Set([
      'Pod',
      'Service',
      'Deployment',
      'ReplicaSet',
      'StatefulSet',
      'DaemonSet',
      'Job',
      'CronJob',
      'ConfigMap',
      'Secret',
      'PersistentVolume',
      'PersistentVolumeClaim',
      'Ingress',
      'NetworkPolicy',
      'ServiceAccount',
      'Role',
      'RoleBinding',
      'ClusterRole',
      'ClusterRoleBinding',
      'Namespace',
    ]);

    return standardKinds.has(kind);
  }
}
