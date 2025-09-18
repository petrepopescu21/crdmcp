import { z } from 'zod';
import { BaseTool } from './base-tool.js';
import type { ToolResult } from '../types/index.js';

export class FindSamplesTool extends BaseTool {
  get name(): string {
    return 'find-samples';
  }

  get description(): string {
    return 'Finds sample manifests by resource type with filtering by complexity and use case';
  }

  get inputSchema(): any {
    return {
      kind: z.string().describe('Resource kind to find samples for (e.g., "RedisCluster")'),
      complexity: z.enum(['simple', 'intermediate', 'advanced']).optional().describe('Filter by sample complexity'),
      tags: z.array(z.string()).optional().describe('Filter samples by tags (e.g., ["production", "ha"])'),
      includeContent: z.boolean().default(true).optional().describe('Include full manifest content in response (default: true)'),
    };
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const { kind, complexity, tags, includeContent = true } = args;

      if (!kind || typeof kind !== 'string') {
        return this.error('kind is required and must be a string', [
          'Use "list-available-resources" to see available resource kinds',
        ]);
      }

      const allSamples = this.data.samples.get(kind) || [];

      if (allSamples.length === 0) {
        const suggestions = this.findAlternativeKinds(kind);
        return this.error(
          `No samples found for resource kind "${kind}"`,
          suggestions
        );
      }

      // Apply filters
      let filteredSamples = allSamples;

      if (complexity) {
        filteredSamples = filteredSamples.filter(
          (sample) => sample.complexity === complexity
        );
      }

      if (tags && tags.length > 0) {
        filteredSamples = filteredSamples.filter((sample) =>
          tags.some((tag: string) =>
            sample.tags.some((sampleTag) =>
              sampleTag.toLowerCase().includes(tag.toLowerCase())
            )
          )
        );
      }

      if (filteredSamples.length === 0) {
        return this.error(
          `No samples found for "${kind}" with the specified filters`,
          [
            'Try removing some filters',
            `${allSamples.length} total samples available for ${kind}`,
            `Available complexities: ${[...new Set(allSamples.map((s) => s.complexity))].join(', ')}`,
          ]
        );
      }

      // Sort samples by complexity (simple first) and then by description
      const sortedSamples = filteredSamples.sort((a, b) => {
        const complexityOrder = { simple: 0, intermediate: 1, advanced: 2 };
        const orderA = complexityOrder[a.complexity];
        const orderB = complexityOrder[b.complexity];

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return a.description.localeCompare(b.description);
      });

      const result = {
        kind,
        totalSamples: allSamples.length,
        filteredCount: sortedSamples.length,
        samples: sortedSamples.map((sample) => ({
          description: sample.description,
          complexity: sample.complexity,
          tags: sample.tags,
          apiVersion: sample.apiVersion,
          filePath: sample.filePath,
          metadata: sample.metadata,
          ...(includeContent && { content: sample.content }),
        })),
        availableComplexities: [
          ...new Set(allSamples.map((s) => s.complexity)),
        ],
        availableTags: [...new Set(allSamples.flatMap((s) => s.tags))],
      };

      return this.success(
        result,
        this.generateSampleSuggestions(kind, sortedSamples, allSamples),
        {
          filtersApplied: { complexity, tags },
          loadedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      return this.error(
        `Failed to find samples: ${error instanceof Error ? error.message : String(error)}`,
        ['Check that the kind parameter is spelled correctly']
      );
    }
  }

  private findAlternativeKinds(kind: string): string[] {
    const suggestions: string[] = [];
    const availableKinds = Array.from(this.data.samples.keys());

    if (availableKinds.length === 0) {
      suggestions.push(
        'No sample manifests are available in the data directory'
      );
      return suggestions;
    }

    // Find similar kind names
    const similar = availableKinds
      .map((k) => ({
        kind: k,
        similarity: this.calculateSimilarity(
          kind.toLowerCase(),
          k.toLowerCase()
        ),
      }))
      .filter((item) => item.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map((item) => item.kind);

    if (similar.length > 0) {
      suggestions.push(`Did you mean one of these: ${similar.join(', ')}?`);
    }

    suggestions.push(
      `Available kinds with samples: ${availableKinds.join(', ')}`
    );

    return suggestions;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    return (
      (longer.length - this.levenshteinDistance(longer, shorter)) /
      longer.length
    );
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private generateSampleSuggestions(
    kind: string,
    samples: any[],
    allSamples: any[]
  ): string[] {
    const suggestions: string[] = [];

    if (samples.length > 0) {
      const simpleCount = samples.filter(
        (s) => s.complexity === 'simple'
      ).length;
      const advancedCount = samples.filter(
        (s) => s.complexity === 'advanced'
      ).length;

      if (simpleCount > 0) {
        suggestions.push(
          `${simpleCount} simple examples available - good starting points`
        );
      }

      if (advancedCount > 0) {
        suggestions.push(
          `${advancedCount} advanced examples available for production scenarios`
        );
      }

      suggestions.push(
        `Use "generate-manifest" to create customized ${kind} manifests`
      );
      suggestions.push(
        `Use "get-resource-details" with resourceType to understand the ${kind} schema`
      );
    }

    if (samples.length < allSamples.length) {
      suggestions.push(
        `${allSamples.length - samples.length} additional samples available with different filters`
      );
    }

    // Suggest related tools
    const hasProductionTags = allSamples.some((s) =>
      s.tags.some(
        (tag: string) => tag.includes('prod') || tag.includes('production')
      )
    );

    if (hasProductionTags) {
      suggestions.push(
        'Production-ready examples available - filter by tags: ["production"]'
      );
    }

    return suggestions;
  }
}
