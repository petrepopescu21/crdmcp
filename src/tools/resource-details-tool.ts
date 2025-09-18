import { z } from 'zod';
import { BaseTool } from './base-tool.js';
import type { ToolResult } from '../types/index.js';

export class ResourceDetailsTool extends BaseTool {
  get name(): string {
    return 'get-resource-details';
  }

  get description(): string {
    return 'Provides comprehensive information about a specific resource type including schema, samples, and guidance';
  }

  get inputSchema(): any {
    return {
      resourceType: z
        .string()
        .describe(
          'Resource type in format "group/kind" (e.g., "redis.example.com/RedisCluster")'
        ),
    };
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const { resourceType } = args;

      if (!resourceType || typeof resourceType !== 'string') {
        return this.error(
          'resourceType is required and must be a string in format "group/kind"',
          ['Use "list-available-resources" to see all available resource types']
        );
      }

      // Find the CRD
      const crd = this.data.crds.get(resourceType);
      if (!crd) {
        const suggestions = this.findSimilarResources(resourceType, 5);
        return this.error(
          `Resource type "${resourceType}" not found`,
          suggestions.length > 0
            ? [`Did you mean: ${suggestions.join(', ')}?`]
            : [
                'Use "list-available-resources" to see all available resource types',
              ]
        );
      }

      // Get samples for this resource kind
      const samples = this.data.samples.get(crd.kind) || [];

      // Get relevant instructions
      const instructions = this.findRelevantInstructions(crd.kind, [
        crd.category || '',
      ]);

      // Find related resources
      const relatedResources = this.findRelatedResources(crd);

      // Generate usage examples
      const usageExamples = this.generateUsageExamples(crd, samples);

      const result = {
        resourceType,
        metadata: {
          kind: crd.kind,
          group: crd.group,
          plural: crd.plural,
          singular: crd.singular,
          shortNames: crd.shortNames || [],
          scope: crd.scope,
          versions: crd.versions,
          category: crd.category || 'uncategorized',
          description: crd.description || `Custom resource of type ${crd.kind}`,
          filePath: crd.filePath,
        },
        samples: samples.map((sample) => ({
          description: sample.description,
          complexity: sample.complexity,
          tags: sample.tags,
          filePath: sample.filePath,
          apiVersion: sample.apiVersion,
          metadata: sample.metadata,
          // Include the full content for simple samples, truncate complex ones
          content:
            sample.complexity === 'simple'
              ? sample.content
              : this.truncateContent(sample.content, 1000),
        })),
        instructions: instructions.slice(0, 5), // Limit to top 5 most relevant
        relatedResources,
        usageExamples,
        bestPractices: this.extractBestPractices(instructions, crd),
      };

      return this.success(
        result,
        this.generateDetailSuggestions(crd, samples, instructions),
        {
          samplesAvailable: samples.length,
          instructionsFound: instructions.length,
          relatedResourcesFound: relatedResources.length,
        }
      );
    } catch (error) {
      return this.error(
        `Failed to get resource details: ${error instanceof Error ? error.message : String(error)}`,
        ['Check that the resource type format is correct (group/kind)']
      );
    }
  }

  private findRelatedResources(crd: any): any[] {
    const related: any[] = [];

    // Find resources in the same group
    for (const [key, otherCrd] of this.data.crds) {
      if (otherCrd.group === crd.group && otherCrd.kind !== crd.kind) {
        related.push({
          resourceType: key,
          kind: otherCrd.kind,
          relationship: 'same-group',
          description:
            otherCrd.description || `Related ${otherCrd.kind} resource`,
        });
      }
    }

    // Find resources in the same category
    if (crd.category) {
      for (const [key, otherCrd] of this.data.crds) {
        if (
          otherCrd.category === crd.category &&
          otherCrd.kind !== crd.kind &&
          otherCrd.group !== crd.group
        ) {
          related.push({
            resourceType: key,
            kind: otherCrd.kind,
            relationship: 'same-category',
            description:
              otherCrd.description ||
              `Related ${otherCrd.kind} in ${crd.category}`,
          });
        }
      }
    }

    // Analyze samples for resource references
    const samples = this.data.samples.get(crd.kind) || [];
    const referencedKinds = new Set<string>();

    for (const sample of samples) {
      const content = JSON.stringify(sample.content);
      // Look for references to other custom resources
      for (const [, otherCrd] of this.data.crds) {
        if (otherCrd.kind !== crd.kind && content.includes(otherCrd.kind)) {
          referencedKinds.add(otherCrd.kind);
        }
      }
    }

    for (const referencedKind of referencedKinds) {
      const referencedCrd = Array.from(this.data.crds.values()).find(
        (c) => c.kind === referencedKind
      );
      if (referencedCrd) {
        const key = `${referencedCrd.group}/${referencedCrd.kind}`;
        if (!related.some((r) => r.resourceType === key)) {
          related.push({
            resourceType: key,
            kind: referencedCrd.kind,
            relationship: 'referenced-in-samples',
            description: `Often used together with ${crd.kind}`,
          });
        }
      }
    }

    return related.slice(0, 10); // Limit to 10 related resources
  }

  private generateUsageExamples(crd: any, samples: any[]): any[] {
    const examples: any[] = [];

    // Basic creation example
    examples.push({
      title: `Create a basic ${crd.kind}`,
      description: `How to create a simple ${crd.kind} resource`,
      apiVersion: `${crd.group}/${crd.versions[0] || 'v1'}`,
      kind: crd.kind,
      example: {
        apiVersion: `${crd.group}/${crd.versions[0] || 'v1'}`,
        kind: crd.kind,
        metadata: {
          name: `example-${crd.kind.toLowerCase()}`,
          ...(crd.scope === 'Namespaced' && { namespace: 'default' }),
        },
        spec: {
          // Basic spec structure based on category
          ...this.generateBasicSpec(crd),
        },
      },
    });

    // Add examples from simple samples
    const simpleSamples = samples
      .filter((s) => s.complexity === 'simple')
      .slice(0, 2);
    for (const sample of simpleSamples) {
      examples.push({
        title: sample.description,
        description: `Example from: ${sample.filePath}`,
        apiVersion: sample.apiVersion,
        kind: sample.kind,
        example: sample.content,
        tags: sample.tags,
      });
    }

    return examples;
  }

  private generateBasicSpec(crd: any): any {
    const spec: any = {};

    // Generate basic spec based on category
    switch (crd.category) {
      case 'database':
        spec.version = '1.0';
        spec.replicas = 1;
        if (crd.kind.toLowerCase().includes('redis')) {
          spec.mode = 'standalone';
        }
        break;

      case 'messaging':
        spec.replicas = 3;
        if (crd.kind.toLowerCase().includes('kafka')) {
          spec.partitions = 1;
          spec.replicationFactor = 1;
        }
        break;

      case 'service':
        spec.port = 8080;
        spec.replicas = 2;
        break;

      default:
        spec.enabled = true;
    }

    return spec;
  }

  private extractBestPractices(instructions: any[], crd: any): string[] {
    const practices: string[] = [];

    for (const instruction of instructions.slice(0, 3)) {
      const content = instruction.content.toLowerCase();

      // Look for best practices sections
      const bestPracticePatterns = [
        /best practices?[:\-\s]([^\n]+)/gi,
        /recommended?[:\-\s]([^\n]+)/gi,
        /important[:\-\s]([^\n]+)/gi,
        /note[:\-\s]([^\n]+)/gi,
      ];

      for (const pattern of bestPracticePatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].length > 10 && match[1].length < 200) {
            practices.push(match[1].trim());
          }
        }
      }
    }

    // Add category-specific best practices
    switch (crd.category) {
      case 'database':
        practices.push(
          'Always configure persistent storage for production databases'
        );
        practices.push('Set appropriate resource limits and requests');
        break;

      case 'messaging':
        practices.push('Configure proper replication for high availability');
        practices.push('Monitor queue depth and consumer lag');
        break;
    }

    return practices.slice(0, 5); // Limit to 5 practices
  }

  private generateDetailSuggestions(
    crd: any,
    samples: any[],
    instructions: any[]
  ): string[] {
    const suggestions: string[] = [];

    if (samples.length > 0) {
      suggestions.push(
        `Use "find-samples" with kind "${crd.kind}" to see all ${samples.length} available examples`
      );

      const complexSamples = samples.filter((s) => s.complexity !== 'simple');
      if (complexSamples.length > 0) {
        suggestions.push(
          `${complexSamples.length} advanced samples available for production scenarios`
        );
      }
    } else {
      suggestions.push(
        'No sample manifests available - consider creating basic examples'
      );
    }

    if (instructions.length > 0) {
      suggestions.push(
        `Use "get-resource-guidance" for detailed setup instructions for ${crd.kind}`
      );
    }

    if (crd.category === 'database') {
      suggestions.push(
        'Use "get-access-patterns" to understand how services connect to databases'
      );
    }

    suggestions.push(
      `Use "generate-manifest" to create a customized ${crd.kind} manifest`
    );

    return suggestions;
  }

  private truncateContent(content: any, maxLength: number): any {
    const str = JSON.stringify(content, null, 2);
    if (str.length <= maxLength) {
      return content;
    }

    const truncated = str.slice(0, maxLength) + '\n... (truncated)';
    try {
      return JSON.parse(truncated);
    } catch {
      return { truncated: true, preview: str.slice(0, maxLength) };
    }
  }
}
