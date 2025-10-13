/**
 * OpenRouter API Client
 * Handles all communication with OpenRouter API for Claude AI integration
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ChatCompletionResponse {
  content: ContentBlock[];
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence';
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Call OpenRouter API with chat completion
 */
export async function chatCompletion(
  messages: Message[],
  systemPrompt: string,
  tools?: Tool[],
  model?: string,
  maxTokens: number = 4096
): Promise<ChatCompletionResponse> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not found. Please set VITE_OPENROUTER_API_KEY in .env file');
  }

  const requestBody: Record<string, unknown> = {
    model: model || 'anthropic/claude-sonnet-4.5',
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    max_tokens: maxTokens,
  };

  // Add system prompt if provided
  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  // Add tools if provided
  if (tools && tools.length > 0) {
    requestBody.tools = tools;
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Personal Lesson Agent',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || ''
        }`
      );
    }

    const data = await response.json();

    // OpenRouter wraps Anthropic's response format
    // Extract the actual content from the response
    const choice = data.choices?.[0];
    if (!choice) {
      throw new Error('No response from API');
    }

    // Parse content - can be string or array of content blocks
    let content: ContentBlock[];
    const messageContent = choice.message?.content;

    if (typeof messageContent === 'string') {
      content = [{ type: 'text', text: messageContent }];
    } else if (Array.isArray(messageContent)) {
      content = messageContent;
    } else {
      content = [];
    }

    // Determine stop reason
    let stopReason: ChatCompletionResponse['stop_reason'] = 'end_turn';
    if (choice.finish_reason === 'tool_calls' || choice.message?.tool_calls) {
      stopReason = 'tool_use';

      // Convert OpenRouter tool_calls format to Anthropic format
      if (choice.message?.tool_calls) {
        content = choice.message.tool_calls.map((tc: any) => ({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input: typeof tc.function.arguments === 'string'
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments,
        }));
      }
    } else if (choice.finish_reason === 'length') {
      stopReason = 'max_tokens';
    } else if (choice.finish_reason === 'stop') {
      stopReason = 'stop_sequence';
    }

    return {
      content,
      stop_reason: stopReason,
      model: data.model || model || 'anthropic/claude-sonnet-4.5',
      usage: data.usage ? {
        input_tokens: data.usage.prompt_tokens || 0,
        output_tokens: data.usage.completion_tokens || 0,
      } : undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to call OpenRouter API: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Extract text from content blocks
 */
export function extractTextFromContent(content: ContentBlock[]): string {
  return content
    .filter(block => block.type === 'text' && block.text)
    .map(block => block.text)
    .join('\n\n');
}

/**
 * Extract tool calls from content blocks
 */
export function extractToolCalls(content: ContentBlock[]): ToolCall[] {
  return content
    .filter(block => block.type === 'tool_use')
    .map(block => ({
      id: block.id!,
      name: block.name!,
      input: block.input!,
    }));
}

/**
 * Create tool result content block
 */
export function createToolResult(toolUseId: string, result: string | Record<string, unknown>): ContentBlock {
  return {
    type: 'tool_result',
    tool_use_id: toolUseId,
    content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
  };
}
