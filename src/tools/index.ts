import type { LoadedData } from '../types/index.js';
import { BaseTool } from './base-tool.js';
import { ListResourcesTool } from './list-resources-tool.js';
import { ResourceDetailsTool } from './resource-details-tool.js';
import { FindSamplesTool } from './find-samples-tool.js';
import { ResourceGuidanceTool } from './resource-guidance-tool.js';

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  constructor(data: LoadedData) {
    // Register all available tools
    this.registerTool(new ListResourcesTool(data));
    this.registerTool(new ResourceDetailsTool(data));
    this.registerTool(new FindSamplesTool(data));
    this.registerTool(new ResourceGuidanceTool(data));
  }

  private registerTool(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" not found`,
        suggestions: [`Available tools: ${this.getToolNames().join(', ')}`],
      };
    }

    try {
      return await tool.execute(args);
    } catch (error) {
      return {
        success: false,
        error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Check the tool parameters and try again'],
      };
    }
  }

  getToolDefinitions(): Array<{
    name: string;
    description: string;
    inputSchema: any;
  }> {
    return this.getAllTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }
}

export * from './base-tool.js';
export * from './list-resources-tool.js';
export * from './resource-details-tool.js';
export * from './find-samples-tool.js';
export * from './resource-guidance-tool.js';
