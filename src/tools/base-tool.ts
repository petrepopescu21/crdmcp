import type { LoadedData, ToolResult } from '../types/index.js';
import { calculateSimilarity } from '../utils/helpers.js';

export abstract class BaseTool {
  constructor(protected data: LoadedData) {}

  abstract get name(): string;
  abstract get description(): string;
  abstract get inputSchema(): any;

  abstract execute(args: any): Promise<ToolResult>;

  protected success(
    data: any,
    suggestions?: string[],
    metadata?: any
  ): ToolResult {
    return {
      success: true,
      data,
      suggestions,
      metadata,
    };
  }

  protected error(message: string, suggestions?: string[]): ToolResult {
    return {
      success: false,
      error: message,
      suggestions,
    };
  }

  protected findSimilarResources(query: string, limit: number = 5): string[] {
    const candidates: { key: string; similarity: number }[] = [];

    // Check CRD kinds and groups
    for (const [key, crd] of this.data.crds) {
      const kindSimilarity = calculateSimilarity(
        query.toLowerCase(),
        crd.kind.toLowerCase()
      );
      const groupSimilarity = calculateSimilarity(
        query.toLowerCase(),
        crd.group.toLowerCase()
      );
      const pluralSimilarity = calculateSimilarity(
        query.toLowerCase(),
        crd.plural.toLowerCase()
      );

      const maxSimilarity = Math.max(
        kindSimilarity,
        groupSimilarity,
        pluralSimilarity
      );

      if (maxSimilarity > 0.3) {
        // Threshold for similarity
        candidates.push({ key, similarity: maxSimilarity });
      }
    }

    return candidates
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((c) => c.key);
  }

  protected findRelevantInstructions(
    resourceType?: string,
    tags?: string[]
  ): any[] {
    const relevant = this.data.instructions.filter((instruction) => {
      // Check if instruction applies to the resource type
      if (resourceType) {
        const lowerResourceType = resourceType.toLowerCase();
        const applicableCRDs =
          instruction.frontmatter.applicableCRDs || instruction.detectedCRDs;

        if (
          applicableCRDs.some(
            (crd: string) =>
              lowerResourceType.includes(crd.toLowerCase()) ||
              crd.toLowerCase().includes(lowerResourceType)
          )
        ) {
          return true;
        }
      }

      // Check tag overlap
      if (tags && tags.length > 0) {
        const instructionTags = instruction.tags || [];
        return tags.some((tag) =>
          instructionTags.some(
            (iTag) =>
              iTag.toLowerCase().includes(tag.toLowerCase()) ||
              tag.toLowerCase().includes(iTag.toLowerCase())
          )
        );
      }

      return !resourceType && !tags; // Return all if no filters
    });

    // Sort by priority (from frontmatter) and then by title
    return relevant
      .sort((a, b) => {
        const priorityA = a.frontmatter.priority || 0;
        const priorityB = b.frontmatter.priority || 0;
        if (priorityA !== priorityB) {
          return priorityB - priorityA; // Higher priority first
        }
        return a.title.localeCompare(b.title);
      })
      .map((instruction) => ({
        title: instruction.title,
        content:
          instruction.content.slice(0, 500) +
          (instruction.content.length > 500 ? '...' : ''),
        tags: instruction.tags,
        filePath: instruction.filePath,
      }));
  }

  protected getCRDsByCategory(
    category?: string
  ): Array<{ key: string; crd: any }> {
    const results = [];

    for (const [key, crd] of this.data.crds) {
      if (!category || crd.category === category) {
        results.push({ key, crd });
      }
    }

    return results.sort((a, b) => a.crd.kind.localeCompare(b.crd.kind));
  }
}
