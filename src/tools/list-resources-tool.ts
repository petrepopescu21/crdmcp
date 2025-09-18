import { z } from 'zod';
import { BaseTool } from './base-tool.js';
import type { ResourceFilter, ToolResult } from '../types/index.js';

export class ListResourcesTool extends BaseTool {
  get name(): string {
    return 'list-available-resources';
  }

  get description(): string {
    return 'Lists all available custom resources with descriptions and filtering options. IMPORTANT: After listing resources, always use get-resource-details and get-resource-guidance to read instructions before creating any resources.';
  }

  get inputSchema(): any {
    return {
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
        .describe(
          'Filter by resource category (database, messaging, service, storage, networking, security)'
        ),
      search: z
        .string()
        .optional()
        .describe(
          'Search term to filter resources by name, group, or description'
        ),
      group: z.string().optional().describe('Filter by specific API group'),
      scope: z
        .enum(['Namespaced', 'Cluster'])
        .optional()
        .describe('Filter by resource scope'),
    };
  }

  async execute(args: any): Promise<ToolResult> {
    try {
      const filter = this.parseFilter(args);
      const resources = this.filterResources(filter);

      if (resources.length === 0) {
        const suggestions = this.generateSuggestions(filter);
        return this.error(
          `No resources found matching the criteria${filter.search ? ` for "${filter.search}"` : ''}`,
          suggestions
        );
      }

      const resourceList = resources.map(({ key, crd }) => ({
        resourceType: key,
        kind: crd.kind,
        group: crd.group,
        plural: crd.plural,
        scope: crd.scope,
        versions: crd.versions,
        category: crd.category || 'uncategorized',
        description: crd.description || `Custom resource of type ${crd.kind}`,
        shortNames: crd.shortNames || [],
      }));

      const categoryStats = this.generateCategoryStatistics(resources);

      return this.success(
        {
          resources: resourceList,
          totalCount: resourceList.length,
          categories: categoryStats,
        },
        this.generateUsageSuggestions(resourceList),
        {
          filterApplied: filter,
          loadedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      return this.error(
        `Failed to list resources: ${error instanceof Error ? error.message : String(error)}`,
        ['Check that the data directory contains valid CRD files']
      );
    }
  }

  private parseFilter(args: any): ResourceFilter {
    return {
      category: args.category,
      search: args.search,
      group: args.group,
      scope: args.scope,
    };
  }

  private filterResources(
    filter: ResourceFilter
  ): Array<{ key: string; crd: any }> {
    let results = Array.from(this.data.crds.entries()).map(([key, crd]) => ({
      key,
      crd,
    }));

    // Apply category filter
    if (filter.category) {
      results = results.filter(({ crd }) => crd.category === filter.category);
    }

    // Apply group filter
    if (filter.group) {
      results = results.filter(({ crd }) => crd.group === filter.group);
    }

    // Apply scope filter
    if (filter.scope) {
      results = results.filter(({ crd }) => crd.scope === filter.scope);
    }

    // Apply search filter
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      results = results.filter(({ key, crd }) => {
        return (
          crd.kind.toLowerCase().includes(searchTerm) ||
          crd.group.toLowerCase().includes(searchTerm) ||
          crd.plural.toLowerCase().includes(searchTerm) ||
          (crd.description &&
            crd.description.toLowerCase().includes(searchTerm)) ||
          key.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Sort by category, then by kind
    return results.sort((a, b) => {
      const categoryA = a.crd.category || 'zzz';
      const categoryB = b.crd.category || 'zzz';

      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }

      return a.crd.kind.localeCompare(b.crd.kind);
    });
  }

  private generateCategoryStatistics(
    resources: Array<{ key: string; crd: any }>
  ): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const { crd } of resources) {
      const category = crd.category || 'uncategorized';
      stats[category] = (stats[category] || 0) + 1;
    }

    return stats;
  }

  private generateSuggestions(filter: ResourceFilter): string[] {
    const suggestions: string[] = [];

    if (filter.search) {
      // Suggest similar resources
      const similar = this.findSimilarResources(filter.search, 3);
      if (similar.length > 0) {
        suggestions.push(
          `Did you mean one of these resources: ${similar.join(', ')}?`
        );
      }
    }

    if (filter.category) {
      // Suggest other categories
      const availableCategories = new Set();
      for (const [, crd] of this.data.crds) {
        if (crd.category && crd.category !== filter.category) {
          availableCategories.add(crd.category);
        }
      }

      if (availableCategories.size > 0) {
        suggestions.push(
          `Try other categories: ${Array.from(availableCategories).join(', ')}`
        );
      }
    }

    if (this.data.crds.size > 0) {
      suggestions.push(
        'Use the get-resource-details tool to learn more about specific resources'
      );
      suggestions.push('Remove filters to see all available resources');
    }

    return suggestions;
  }

  private generateUsageSuggestions(resources: any[]): string[] {
    const suggestions: string[] = [];

    if (resources.length > 0) {
      const firstResource = resources[0];
      suggestions.push(
        `NEXT STEPS: Use "get-resource-details" with resourceType "${firstResource.resourceType}" for schema and samples`
      );
      suggestions.push(
        `THEN: Use "get-resource-guidance" to read deployment instructions before creating resources`
      );

      if (resources.some((r) => r.category === 'database')) {
        suggestions.push(
          'For database resources, check out access pattern guidance with "get-access-patterns"'
        );
      }

      if (resources.length > 5) {
        suggestions.push(
          'Consider using category or search filters to narrow down results'
        );
      }
    }

    return suggestions;
  }
}
