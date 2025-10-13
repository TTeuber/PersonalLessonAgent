/**
 * Abstract Agent Base Class
 * Provides common functionality for all AI agents with tool-use loop
 */

import {
  chatCompletion,
  extractTextFromContent,
  extractToolCalls,
  createToolResult,
  type Message,
  type Tool,
  type ContentBlock,
} from '../api/openrouter';
import { DEFAULT_MODEL } from '../api/models';
import type { ToolCall, ToolResult, AgentResponse } from '../../types/agent';
import type { HierarchicalContext } from '../../types/context';

/**
 * Tool execution function type
 */
export type ToolExecutor = (
  toolName: string,
  input: Record<string, unknown>,
  context: Partial<HierarchicalContext>
) => Promise<string | Record<string, unknown>>;

/**
 * Abstract base class for all agents
 */
export abstract class Agent {
  protected model: string;
  protected maxIterations: number = 10; // Prevent infinite loops

  constructor(model?: string) {
    this.model = model || DEFAULT_MODEL;
  }

  /**
   * Get the system prompt for this agent
   * Must be implemented by subclasses
   */
  protected abstract getSystemPrompt(context: Partial<HierarchicalContext>): string;

  /**
   * Get the tools available to this agent
   * Must be implemented by subclasses
   */
  protected abstract getTools(): Tool[];

  /**
   * Execute a tool call
   * Can be overridden by subclasses for custom tool execution
   */
  protected abstract executeTool(
    toolName: string,
    input: Record<string, unknown>,
    context: Partial<HierarchicalContext>
  ): Promise<string | Record<string, unknown>>;

  /**
   * Run the agent with a user input
   * Handles the tool-use loop automatically
   */
  async run(
    userInput: string,
    context: Partial<HierarchicalContext>
  ): Promise<AgentResponse> {
    const systemPrompt = this.getSystemPrompt(context);
    const tools = this.getTools();
    const messages: Message[] = [
      {
        role: 'user',
        content: userInput,
      },
    ];

    let iterations = 0;

    // Tool-use loop
    while (iterations < this.maxIterations) {
      iterations++;

      // Call the API
      const response = await chatCompletion(
        messages,
        systemPrompt,
        tools.length > 0 ? tools : undefined,
        this.model
      );

      // Add assistant response to messages
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      // If the model is done, return the response
      if (response.stop_reason === 'end_turn' || response.stop_reason === 'stop_sequence') {
        return {
          text: extractTextFromContent(response.content),
          stopReason: response.stop_reason,
          usage: response.usage ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          } : undefined,
        };
      }

      // If the model wants to use tools
      if (response.stop_reason === 'tool_use') {
        const toolCalls = extractToolCalls(response.content);

        if (toolCalls.length === 0) {
          throw new Error('Model indicated tool use but no tool calls found');
        }

        // Execute all tool calls
        const toolResults = await this.executeToolCalls(toolCalls, context);

        // Add tool results to messages
        const toolResultContent: ContentBlock[] = toolResults.map(tr =>
          createToolResult(tr.toolUseId, tr.result)
        );

        messages.push({
          role: 'user',
          content: toolResultContent,
        });

        // Continue the loop
        continue;
      }

      // If we hit max_tokens, return what we have
      if (response.stop_reason === 'max_tokens') {
        return {
          text: extractTextFromContent(response.content),
          stopReason: response.stop_reason,
          usage: response.usage ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          } : undefined,
        };
      }
    }

    throw new Error(`Agent exceeded maximum iterations (${this.maxIterations})`);
  }

  /**
   * Execute multiple tool calls
   */
  private async executeToolCalls(
    toolCalls: ToolCall[],
    context: Partial<HierarchicalContext>
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      try {
        const result = await this.executeTool(toolCall.name, toolCall.input, context);
        results.push({
          toolUseId: toolCall.id,
          result,
          isError: false,
        });
      } catch (error) {
        console.error(`Error executing tool ${toolCall.name}:`, error);
        results.push({
          toolUseId: toolCall.id,
          result: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          isError: true,
        });
      }
    }

    return results;
  }

  /**
   * Stream responses (for future implementation)
   * This would allow real-time display of AI responses
   */
  async *runStream(
    userInput: string,
    context: Partial<HierarchicalContext>
  ): AsyncGenerator<string, AgentResponse, unknown> {
    // TODO: Implement streaming in Phase 5
    // For now, just yield the final response
    const response = await this.run(userInput, context);
    yield response.text;
    return response;
  }
}
