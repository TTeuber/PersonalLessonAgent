import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Agent } from './Agent';
import type { Tool } from '../api/openrouter';
import type { HierarchicalContext } from '../../types/context';
import { mockHierarchicalContext } from '../../__tests__/fixtures/context-fixtures';
import * as openrouter from '../api/openrouter';

// Create a concrete test implementation of Agent
class TestAgent extends Agent {
  public systemPromptText = 'You are a test agent.';
  public toolsList: Tool[] = [];
  public toolExecutor = vi.fn();

  protected getSystemPrompt(context: Partial<HierarchicalContext>): string {
    return this.systemPromptText;
  }

  protected getTools(): Tool[] {
    return this.toolsList;
  }

  protected async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    context: Partial<HierarchicalContext>
  ): Promise<string | Record<string, unknown>> {
    return this.toolExecutor(toolName, input, context);
  }
}

describe('Agent', () => {
  let agent: TestAgent;
  let chatCompletionSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    agent = new TestAgent();
    chatCompletionSpy = vi.spyOn(openrouter, 'chatCompletion');
  });

  describe('run()', () => {
    it('should execute a simple request without tools', async () => {
      const mockResponse = {
        content: [{ type: 'text' as const, text: 'This is a test response' }],
        stop_reason: 'end_turn' as const,
        usage: {
          input_tokens: 100,
          output_tokens: 50,
        },
      };

      chatCompletionSpy.mockResolvedValueOnce(mockResponse);

      const result = await agent.run('Test input', mockHierarchicalContext);

      expect(result.text).toBe('This is a test response');
      expect(result.stopReason).toBe('end_turn');
      expect(result.usage).toEqual({
        inputTokens: 100,
        outputTokens: 50,
      });
      expect(chatCompletionSpy).toHaveBeenCalledOnce();
    });

    it('should handle tool use with a single tool call', async () => {
      // Setup tools
      agent.toolsList = [
        {
          name: 'test_tool',
          description: 'A test tool',
          input_schema: {
            type: 'object',
            properties: {
              input: { type: 'string' },
            },
            required: ['input'],
          },
        },
      ];

      agent.toolExecutor.mockResolvedValueOnce('Tool execution result');

      // Mock first response with tool use
      const toolUseResponse = {
        content: [
          {
            type: 'tool_use' as const,
            id: 'test-tool-id',
            name: 'test_tool',
            input: { input: 'test' },
          },
        ],
        stop_reason: 'tool_use' as const,
      };

      // Mock second response after tool execution
      const finalResponse = {
        content: [{ type: 'text' as const, text: 'Final response after tool use' }],
        stop_reason: 'end_turn' as const,
        usage: {
          input_tokens: 200,
          output_tokens: 100,
        },
      };

      chatCompletionSpy
        .mockResolvedValueOnce(toolUseResponse)
        .mockResolvedValueOnce(finalResponse);

      const result = await agent.run('Test input', mockHierarchicalContext);

      expect(result.text).toBe('Final response after tool use');
      expect(result.stopReason).toBe('end_turn');
      expect(chatCompletionSpy).toHaveBeenCalledTimes(2);
      expect(agent.toolExecutor).toHaveBeenCalledWith(
        'test_tool',
        { input: 'test' },
        mockHierarchicalContext
      );
    });

    it('should handle multiple tool calls in sequence', async () => {
      agent.toolsList = [
        {
          name: 'tool_one',
          description: 'First tool',
          input_schema: { type: 'object', properties: {}, required: [] },
        },
        {
          name: 'tool_two',
          description: 'Second tool',
          input_schema: { type: 'object', properties: {}, required: [] },
        },
      ];

      agent.toolExecutor
        .mockResolvedValueOnce('Result 1')
        .mockResolvedValueOnce('Result 2');

      // First tool call
      chatCompletionSpy.mockResolvedValueOnce({
        content: [
          {
            type: 'tool_use' as const,
            id: 'tool-1-id',
            name: 'tool_one',
            input: {},
          },
        ],
        stop_reason: 'tool_use' as const,
      });

      // Second tool call
      chatCompletionSpy.mockResolvedValueOnce({
        content: [
          {
            type: 'tool_use' as const,
            id: 'tool-2-id',
            name: 'tool_two',
            input: {},
          },
        ],
        stop_reason: 'tool_use' as const,
      });

      // Final response
      chatCompletionSpy.mockResolvedValueOnce({
        content: [{ type: 'text' as const, text: 'All tools executed' }],
        stop_reason: 'end_turn' as const,
      });

      const result = await agent.run('Test input', mockHierarchicalContext);

      expect(result.text).toBe('All tools executed');
      expect(chatCompletionSpy).toHaveBeenCalledTimes(3);
      expect(agent.toolExecutor).toHaveBeenCalledTimes(2);
    });

    it('should handle tool execution errors gracefully', async () => {
      agent.toolsList = [
        {
          name: 'failing_tool',
          description: 'A tool that fails',
          input_schema: { type: 'object', properties: {}, required: [] },
        },
      ];

      agent.toolExecutor.mockRejectedValueOnce(new Error('Tool execution failed'));

      chatCompletionSpy.mockResolvedValueOnce({
        content: [
          {
            type: 'tool_use' as const,
            id: 'failing-tool-id',
            name: 'failing_tool',
            input: {},
          },
        ],
        stop_reason: 'tool_use' as const,
      });

      chatCompletionSpy.mockResolvedValueOnce({
        content: [{ type: 'text' as const, text: 'Handled error response' }],
        stop_reason: 'end_turn' as const,
      });

      const result = await agent.run('Test input', mockHierarchicalContext);

      expect(result.text).toBe('Handled error response');
      expect(chatCompletionSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw error when max iterations exceeded', async () => {
      agent.toolsList = [
        {
          name: 'infinite_tool',
          description: 'A tool that never ends',
          input_schema: { type: 'object', properties: {}, required: [] },
        },
      ];

      agent.toolExecutor.mockResolvedValue('Result');

      // Mock infinite tool use
      chatCompletionSpy.mockResolvedValue({
        content: [
          {
            type: 'tool_use' as const,
            id: 'infinite-id',
            name: 'infinite_tool',
            input: {},
          },
        ],
        stop_reason: 'tool_use' as const,
      });

      await expect(agent.run('Test input', mockHierarchicalContext)).rejects.toThrow(
        'Agent exceeded maximum iterations (10)'
      );

      expect(chatCompletionSpy).toHaveBeenCalledTimes(10);
    });

    it('should handle max_tokens stop reason', async () => {
      const mockResponse = {
        content: [{ type: 'text' as const, text: 'Partial response due to max tokens...' }],
        stop_reason: 'max_tokens' as const,
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
        },
      };

      chatCompletionSpy.mockResolvedValueOnce(mockResponse);

      const result = await agent.run('Test input', mockHierarchicalContext);

      expect(result.text).toBe('Partial response due to max tokens...');
      expect(result.stopReason).toBe('max_tokens');
    });

    it('should use custom model when provided', async () => {
      const customAgent = new TestAgent('custom-model');

      chatCompletionSpy.mockResolvedValueOnce({
        content: [{ type: 'text' as const, text: 'Response' }],
        stop_reason: 'end_turn' as const,
      });

      await customAgent.run('Test', mockHierarchicalContext);

      expect(chatCompletionSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        undefined,
        'custom-model'
      );
    });

    it('should pass context to system prompt generator', async () => {
      const contextSpy = vi.spyOn(agent, 'getSystemPrompt' as any);

      chatCompletionSpy.mockResolvedValueOnce({
        content: [{ type: 'text' as const, text: 'Response' }],
        stop_reason: 'end_turn' as const,
      });

      await agent.run('Test', mockHierarchicalContext);

      expect(contextSpy).toHaveBeenCalledWith(mockHierarchicalContext);
    });

    it('should throw error when tool_use stop reason but no tool calls found', async () => {
      chatCompletionSpy.mockResolvedValueOnce({
        content: [{ type: 'text' as const, text: 'Just text, no tool calls' }],
        stop_reason: 'tool_use' as const,
      });

      await expect(agent.run('Test input', mockHierarchicalContext)).rejects.toThrow(
        'Model indicated tool use but no tool calls found'
      );
    });
  });

  describe('runStream()', () => {
    it('should yield final response text', async () => {
      chatCompletionSpy.mockResolvedValueOnce({
        content: [{ type: 'text' as const, text: 'Streamed response' }],
        stop_reason: 'end_turn' as const,
        usage: {
          input_tokens: 50,
          output_tokens: 25,
        },
      });

      const generator = agent.runStream('Test', mockHierarchicalContext);
      const chunks: string[] = [];

      for await (const chunk of generator) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Streamed response']);
    });
  });
});
