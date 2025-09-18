import { readFileSync } from 'fs';
import { glob } from 'glob';
import { loadAll } from 'js-yaml';
import { resolve, basename } from 'path';
import type { SampleManifest } from '../types/index.js';
import {
  extractTagsFromContent,
  generateDescription,
} from '../utils/helpers.js';
import type { Logger } from '../utils/logger.js';

export class SampleLoader {
  constructor(
    private dataDir: string,
    private logger: Logger
  ) {}

  async loadSamples(): Promise<{
    samples: Map<string, SampleManifest[]>;
    errors: string[];
    warnings: string[];
  }> {
    const startTime = Date.now();
    const samples = new Map<string, SampleManifest[]>();
    const errors: string[] = [];
    const warnings: string[] = [];

    const sampleDir = resolve(this.dataDir, 'samples');
    this.logger.debug(`Loading samples from: ${sampleDir}`);

    try {
      // Find all YAML files recursively
      const files = await glob('**/*.{yml,yaml}', {
        cwd: sampleDir,
        nodir: true,
        absolute: true,
      });

      this.logger.debug(`Found ${files.length} sample files to process`);

      for (const filePath of files) {
        try {
          const fileContent = readFileSync(filePath, 'utf8');
          const documents = loadAll(fileContent) as any[];

          for (const doc of documents) {
            if (!doc || typeof doc !== 'object') continue;

            if (this.isKubernetesManifest(doc)) {
              try {
                const sample = this.createSampleManifest(
                  doc,
                  filePath,
                  fileContent
                );
                const kind = sample.kind;

                if (!samples.has(kind)) {
                  samples.set(kind, []);
                }

                samples.get(kind)!.push(sample);
                this.logger.debug(
                  `Loaded sample: ${kind}/${sample.metadata.name || 'unnamed'} from ${filePath}`
                );
              } catch (error) {
                errors.push(
                  `Failed to process sample in ${filePath}: ${error instanceof Error ? error.message : String(error)}`
                );
              }
            }
          }
        } catch (error) {
          errors.push(
            `Failed to read sample file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    } catch (error) {
      errors.push(
        `Failed to scan samples directory: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    this.logger.timing('Sample loading', startTime);
    const totalSamples = Array.from(samples.values()).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    this.logger.info(
      `Loaded ${totalSamples} samples for ${samples.size} resource types`
    );

    if (errors.length > 0) {
      this.logger.warn(`Sample loading had ${errors.length} errors`);
    }

    return { samples, errors, warnings };
  }

  private isKubernetesManifest(doc: any): boolean {
    return (
      doc &&
      typeof doc === 'object' &&
      typeof doc.apiVersion === 'string' &&
      typeof doc.kind === 'string' &&
      doc.metadata &&
      typeof doc.metadata === 'object'
    );
  }

  private createSampleManifest(
    doc: any,
    filePath: string,
    fileContent: string
  ): SampleManifest {
    const tags = extractTagsFromContent(fileContent);
    const fileName = basename(filePath);

    // Add filename-based tags
    const fileNameTags = this.extractTagsFromFileName(fileName);
    tags.push(...fileNameTags);

    // Determine complexity based on content and structure
    const complexity = this.determineComplexity(doc, fileContent);

    // Generate description from annotations, comments, or filename
    const description = this.extractSampleDescription(
      doc,
      fileName,
      fileContent
    );

    return {
      content: doc,
      apiVersion: doc.apiVersion,
      kind: doc.kind,
      metadata: doc.metadata,
      filePath,
      description,
      tags: [...new Set(tags)], // Remove duplicates
      complexity,
    };
  }

  private extractTagsFromFileName(fileName: string): string[] {
    const tags: string[] = [];
    const baseName = fileName.replace(/\.(ya?ml)$/i, '');

    // Extract common patterns from filename
    if (baseName.includes('simple') || baseName.includes('basic')) {
      tags.push('simple');
    }
    if (baseName.includes('advanced') || baseName.includes('complex')) {
      tags.push('advanced');
    }
    if (baseName.includes('prod') || baseName.includes('production')) {
      tags.push('production');
    }
    if (baseName.includes('dev') || baseName.includes('development')) {
      tags.push('development');
    }
    if (baseName.includes('test') || baseName.includes('testing')) {
      tags.push('testing');
    }

    return tags;
  }

  private determineComplexity(
    doc: any,
    fileContent: string
  ): 'simple' | 'intermediate' | 'advanced' {
    let complexityScore = 0;

    // Check for various complexity indicators
    const content = JSON.stringify(doc);

    // Resource requests/limits
    if (content.includes('resources')) complexityScore += 1;

    // Security contexts
    if (content.includes('securityContext')) complexityScore += 1;

    // Multiple containers
    if (doc.spec?.template?.spec?.containers?.length > 1) complexityScore += 2;

    // Init containers
    if (doc.spec?.template?.spec?.initContainers) complexityScore += 2;

    // Volume mounts
    if (content.includes('volumeMounts')) complexityScore += 1;

    // Environment variables
    if (content.includes('env:')) complexityScore += 1;

    // Service accounts
    if (content.includes('serviceAccount')) complexityScore += 1;

    // Ingress/networking
    if (doc.kind === 'Ingress' || content.includes('networkPolicy')) {
      complexityScore += 2;
    }

    // ConfigMaps/Secrets
    if (content.includes('configMap') || content.includes('secret')) {
      complexityScore += 1;
    }

    // File length indicator
    const lines = fileContent.split('\n').length;
    if (lines > 100) complexityScore += 2;
    else if (lines > 50) complexityScore += 1;

    if (complexityScore >= 5) return 'advanced';
    if (complexityScore >= 2) return 'intermediate';
    return 'simple';
  }

  private extractSampleDescription(
    doc: any,
    fileName: string,
    fileContent: string
  ): string {
    // Try to get description from annotations
    const annotations = doc.metadata?.annotations;
    if (annotations?.['description']) {
      return annotations['description'];
    }

    // Try to get from comments at the top of the file
    const lines = fileContent.split('\n');
    const commentLines = lines
      .filter((line) => line.trim().startsWith('#'))
      .slice(0, 3); // First 3 comment lines

    if (commentLines.length > 0) {
      const description = commentLines
        .map((line) => line.replace(/^#\s*/, ''))
        .join(' ')
        .trim();
      if (description && !description.toLowerCase().includes('yaml')) {
        return description;
      }
    }

    // Generate from filename and resource info
    const baseName = fileName.replace(/\.(ya?ml)$/i, '');
    const resourceName = doc.metadata?.name || 'unnamed';

    return `${generateDescription(baseName)} - ${doc.kind} example${
      resourceName !== 'unnamed' ? ` (${resourceName})` : ''
    }`;
  }
}
