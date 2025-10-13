/**
 * Tool Executor
 * Executes tool calls from AI agents
 */

import type { HierarchicalContext } from '../../types/context';

/**
 * Base tool executor class
 * Provides a registry of tool implementations
 */
export class ToolExecutor {
  private tools: Map<string, ToolFunction> = new Map();

  /**
   * Register a tool
   */
  registerTool(name: string, func: ToolFunction): void {
    this.tools.set(name, func);
  }

  /**
   * Execute a tool by name
   */
  async execute(
    toolName: string,
    input: Record<string, unknown>,
    context: Partial<HierarchicalContext>
  ): Promise<string | Record<string, unknown>> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    try {
      return await tool(input, context);
    } catch (error) {
      throw new Error(
        `Error executing tool ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a tool exists
   */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get all registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

/**
 * Tool function type
 */
export type ToolFunction = (
  input: Record<string, unknown>,
  context: Partial<HierarchicalContext>
) => Promise<string | Record<string, unknown>>;

/**
 * Create a default tool executor with no tools
 */
export function createToolExecutor(): ToolExecutor {
  return new ToolExecutor();
}
