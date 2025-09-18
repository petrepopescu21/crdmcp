import { z } from 'zod';
import { BaseTool } from './base-tool.js';
import type { ToolResult } from '../types/index.js';

export class ResourceGuidanceTool extends BaseTool {
  get name(): string {
    return 'get-resource-guidance';
  }

  get description(): string {
    return 'Returns instructions and guidance relevant to specific resource types or categories';
  }

  get inputSchema(): any {
    return {
      resourceType: z
        .string()
        .optional()
        .describe(
          'Specific resource type (group/kind) or kind to get guidance for'
        ),
      category: z
        .enum([
          'database',
          'messaging',
          'service',
          'storage',
          'networking',
          'security',
        ])
        .optional()
        .describe('Resource category to get guidance for'),
      tags: z
        .array(z.string())
        .optional()
        .describe('Filter guidance by specific tags'),
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(10)
        .optional()
        .describe(
          'Maximum number of guidance documents to return (default: 10)'
        ),
    };
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const { resourceType, category, tags, limit = 10 } = args;

      if (!resourceType && !category && (!tags || tags.length === 0)) {
        return this.error(
          'At least one of resourceType, category, or tags must be provided',
          [
            'Use resourceType for specific resource guidance (e.g., "RedisCluster")',
            'Use category for broader guidance (e.g., "database")',
            'Use tags for specific topics (e.g., ["production", "security"])',
          ]
        );
      }

      const guidance = this.findGuidance(resourceType, category, tags, limit);

      if (guidance.length === 0) {
        return this.error(
          'No guidance documents found matching the criteria',
          this.generateNoResultsSuggestions(resourceType, category)
        );
      }

      const result = {
        criteria: { resourceType, category, tags },
        guidanceCount: guidance.length,
        totalAvailable: this.data.instructions.length,
        guidance: guidance.map((doc) => ({
          title: doc.title,
          content: doc.content,
          tags: doc.tags,
          applicableCRDs: doc.frontmatter.applicableCRDs || doc.detectedCRDs,
          category: doc.frontmatter.category,
          priority: doc.frontmatter.priority || 0,
          filePath: doc.filePath,
        })),
        relatedResources: this.findRelatedResourcesFromGuidance(guidance),
        bestPractices: this.extractBestPracticesFromGuidance(guidance),
      };

      return this.success(
        result,
        this.generateGuidanceSuggestions(resourceType, category, guidance),
        {
          searchCriteria: { resourceType, category, tags },
          loadedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      return this.error(
        `Failed to get resource guidance: ${error instanceof Error ? error.message : String(error)}`,
        ['Check that resource types and categories are spelled correctly']
      );
    }
  }

  private findGuidance(
    resourceType?: string,
    category?: string,
    tags?: string[],
    limit: number = 10
  ): any[] {
    let relevantInstructions = this.data.instructions;

    // Filter by resource type
    if (resourceType) {
      relevantInstructions = relevantInstructions.filter((instruction) => {
        const lowerResourceType = resourceType.toLowerCase();
        const applicableCRDs = [
          ...(instruction.frontmatter.applicableCRDs || []),
          ...instruction.detectedCRDs,
        ];

        // Check if the resource type or kind matches
        const matches = applicableCRDs.some(
          (crd: string) =>
            crd.toLowerCase().includes(lowerResourceType) ||
            lowerResourceType.includes(crd.toLowerCase())
        );

        // Also check if the resource type is mentioned in content
        const contentMatches = instruction.content
          .toLowerCase()
          .includes(lowerResourceType);

        return matches || contentMatches;
      });
    }

    // Filter by category
    if (category) {
      relevantInstructions = relevantInstructions.filter((instruction) => {
        // Check frontmatter category
        if (instruction.frontmatter.category === category) {
          return true;
        }

        // Check if category appears in tags
        return instruction.tags.includes(category);
      });
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      relevantInstructions = relevantInstructions.filter((instruction) =>
        tags.some((tag) =>
          instruction.tags.some(
            (instructionTag: string) =>
              instructionTag.toLowerCase().includes(tag.toLowerCase()) ||
              tag.toLowerCase().includes(instructionTag.toLowerCase())
          )
        )
      );
    }

    // Sort by relevance (priority, then by how many criteria match)
    return relevantInstructions
      .map((instruction) => ({
        ...instruction,
        relevanceScore: this.calculateRelevanceScore(
          instruction,
          resourceType,
          category,
          tags
        ),
      }))
      .sort((a, b) => {
        // Higher priority first
        const priorityA = a.frontmatter.priority || 0;
        const priorityB = b.frontmatter.priority || 0;
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }

        // Higher relevance score first
        return b.relevanceScore - a.relevanceScore;
      })
      .slice(0, limit);
  }

  private calculateRelevanceScore(
    instruction: any,
    resourceType?: string,
    category?: string,
    tags?: string[]
  ): number {
    let score = 0;

    // Base score from priority
    score += (instruction.frontmatter.priority || 0) * 10;

    // Score for resource type match
    if (resourceType) {
      const lowerResourceType = resourceType.toLowerCase();
      const applicableCRDs = [
        ...(instruction.frontmatter.applicableCRDs || []),
        ...instruction.detectedCRDs,
      ];

      if (
        applicableCRDs.some((crd: string) =>
          crd.toLowerCase().includes(lowerResourceType)
        )
      ) {
        score += 20;
      }

      if (instruction.title.toLowerCase().includes(lowerResourceType)) {
        score += 15;
      }
    }

    // Score for category match
    if (category && instruction.frontmatter.category === category) {
      score += 15;
    }

    // Score for tag matches
    if (tags) {
      const matchingTags = tags.filter((tag) =>
        instruction.tags.some((instructionTag: string) =>
          instructionTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      score += matchingTags.length * 5;
    }

    return score;
  }

  private findRelatedResourcesFromGuidance(guidance: any[]): any[] {
    const relatedResources = new Set<string>();

    for (const doc of guidance) {
      // Add explicitly mentioned applicable CRDs
      const applicableCRDs = [
        ...(doc.frontmatter.applicableCRDs || []),
        ...doc.detectedCRDs,
      ];

      for (const crd of applicableCRDs) {
        // Try to find matching CRD in our loaded data
        for (const [key, crdData] of this.data.crds) {
          if (
            key.toLowerCase().includes(crd.toLowerCase()) ||
            crdData.kind.toLowerCase().includes(crd.toLowerCase())
          ) {
            relatedResources.add(key);
          }
        }
      }
    }

    return Array.from(relatedResources)
      .slice(0, 10)
      .map((resourceType) => {
        const crd = this.data.crds.get(resourceType);
        return {
          resourceType,
          kind: crd?.kind,
          description: crd?.description || `${crd?.kind} resource`,
        };
      });
  }

  private extractBestPracticesFromGuidance(guidance: any[]): string[] {
    const practices: string[] = [];

    for (const doc of guidance.slice(0, 5)) {
      // Check top 5 documents
      const content = doc.content;

      // Look for best practices sections
      const bestPracticePatterns = [
        /(?:^|\n)## Best Practices?\s*\n([\s\S]*?)(?=\n## |\n# |$)/gi,
        /(?:^|\n)## Recommendations?\s*\n([\s\S]*?)(?=\n## |\n# |$)/gi,
        /(?:^|\n)\*\*Best Practice[:\s]*\*\*(.*?)(?:\n|$)/gi,
        /(?:^|\n)> \*\*Note[:\s]*\*\*(.*?)(?:\n|$)/gi,
      ];

      for (const pattern of bestPracticePatterns) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            // Extract bullet points or lines
            const lines = match[1]
              .split('\n')
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 10 && line.length < 200)
              .map((line: string) => line.replace(/^[-*]\s*/, '').trim());

            practices.push(...lines);
          }
        }
      }
    }

    // Deduplicate and limit
    return [...new Set(practices)].slice(0, 10);
  }

  private generateNoResultsSuggestions(
    resourceType?: string,
    category?: string
  ): string[] {
    const suggestions: string[] = [];

    if (resourceType) {
      // Find similar resource types
      const similar = this.findSimilarResources(resourceType, 3);
      if (similar.length > 0) {
        suggestions.push(`Try similar resources: ${similar.join(', ')}`);
      }
    }

    if (category) {
      // Suggest available categories
      const availableCategories = new Set(
        this.data.instructions
          .map((i) => i.frontmatter.category)
          .filter((c) => c && c !== category)
      );

      if (availableCategories.size > 0) {
        suggestions.push(
          `Try other categories: ${Array.from(availableCategories).join(', ')}`
        );
      }
    }

    // Show available tags
    const availableTags = [
      ...new Set(this.data.instructions.flatMap((i) => i.tags)),
    ];
    if (availableTags.length > 0) {
      suggestions.push(
        `Available tags: ${availableTags.slice(0, 10).join(', ')}`
      );
    }

    suggestions.push('Remove some filters to broaden the search');

    return suggestions;
  }

  private generateGuidanceSuggestions(
    resourceType?: string,
    category?: string,
    guidance?: any[]
  ): string[] {
    const suggestions: string[] = [];

    if (guidance && guidance.length > 0) {
      suggestions.push(
        'Use "find-samples" to see practical examples for these resources'
      );

      if (resourceType) {
        suggestions.push(
          `Use "get-resource-details" for detailed schema information about ${resourceType}`
        );
      }

      const hasProductionGuidance = guidance.some(
        (g) =>
          g.tags.includes('production') ||
          g.content.toLowerCase().includes('production')
      );

      if (hasProductionGuidance) {
        suggestions.push(
          'Production deployment guidance is available in the results'
        );
      }
    }

    if (category === 'database') {
      suggestions.push(
        'Use "get-access-patterns" for database connectivity guidance'
      );
    }

    return suggestions;
  }
}
