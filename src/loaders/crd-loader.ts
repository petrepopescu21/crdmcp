import { readFileSync } from 'fs';
import { glob } from 'glob';
import { loadAll } from 'js-yaml';
import { resolve } from 'path';
import type { CRDDefinition, CRDMetadata } from '../types/index.js';
import {
  generateResourceKey,
  inferResourceCategory,
  generateDescription,
} from '../utils/helpers.js';
import type { Logger } from '../utils/logger.js';

export class CRDLoader {
  constructor(
    private dataDir: string,
    private logger: Logger
  ) {}

  async loadCRDs(): Promise<{
    crds: Map<string, CRDMetadata>;
    errors: string[];
    warnings: string[];
  }> {
    const startTime = Date.now();
    const crds = new Map<string, CRDMetadata>();
    const errors: string[] = [];
    const warnings: string[] = [];

    const crdDir = resolve(this.dataDir, 'crds');
    this.logger.debug(`Loading CRDs from: ${crdDir}`);

    try {
      // Find all YAML files recursively
      const files = await glob('**/*.{yml,yaml}', { 
        cwd: crdDir,
        nodir: true,
        absolute: true
      });

      this.logger.debug(`Found ${files.length} CRD files to process`);

      for (const filePath of files) {
        try {
          const fileContent = readFileSync(filePath, 'utf8');
          const documents = loadAll(fileContent) as any[];

          for (const doc of documents) {
            if (!doc || typeof doc !== 'object') continue;

            if (this.isCRDDocument(doc)) {
              try {
                const crdMetadata = this.extractCRDMetadata(doc, filePath);
                const key = generateResourceKey(
                  crdMetadata.group,
                  crdMetadata.kind
                );

                if (crds.has(key)) {
                  warnings.push(`Duplicate CRD found: ${key} (${filePath})`);
                }

                crds.set(key, crdMetadata);
                this.logger.debug(`Loaded CRD: ${key} from ${filePath}`);
              } catch (error) {
                errors.push(
                  `Failed to process CRD in ${filePath}: ${error instanceof Error ? error.message : String(error)}`
                );
              }
            }
          }
        } catch (error) {
          errors.push(
            `Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    } catch (error) {
      errors.push(
        `Failed to scan CRD directory: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    this.logger.timing('CRD loading', startTime);
    this.logger.info(`Loaded ${crds.size} CRDs`);

    if (errors.length > 0) {
      this.logger.warn(`CRD loading had ${errors.length} errors`);
    }

    return { crds, errors, warnings };
  }

  private isCRDDocument(doc: any): doc is CRDDefinition {
    return (
      doc &&
      typeof doc === 'object' &&
      doc.kind === 'CustomResourceDefinition' &&
      doc.spec &&
      doc.spec.group &&
      doc.spec.names &&
      doc.spec.names.kind
    );
  }

  private extractCRDMetadata(
    crd: CRDDefinition,
    filePath: string
  ): CRDMetadata {
    const { spec } = crd;
    const versions = spec.versions?.map((v) => v.name) || ['v1'];

    const metadata: CRDMetadata = {
      group: spec.group,
      kind: spec.names.kind,
      plural: spec.names.plural,
      singular: spec.names.singular,
      shortNames: spec.names.shortNames,
      scope: spec.scope,
      versions,
      filePath,
      description: this.extractDescription(crd),
      category: inferResourceCategory(spec.names.kind),
    };

    return metadata;
  }

  private extractDescription(crd: CRDDefinition): string {
    // Try to get description from various places
    const annotations = crd.metadata?.annotations;
    if (annotations?.['description']) {
      return annotations['description'];
    }

    // Try OpenAPI schema description
    const schema = crd.spec.versions?.[0]?.schema?.openAPIV3Schema;
    if (schema?.description) {
      return schema.description;
    }

    // Generate from kind name
    return generateDescription(crd.spec.names.kind);
  }
}
