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

/**
 * OpenAI tool format (used by OpenRouter)
 */
export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

/**
 * OpenAI message formats
 */
interface OpenAITextMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface OpenAIAssistantToolCallMessage {
  role: 'assistant';
  content: string | null;
  tool_calls: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface OpenAIToolMessage {
  role: 'tool';
  tool_call_id: string;
  content: string;
}

type OpenAIMessage = OpenAITextMessage | OpenAIAssistantToolCallMessage | OpenAIToolMessage;

/**
 * OpenRouter API response structure
 */
interface OpenRouterChoice {
  message?: {
    content?: string | ContentBlock[];
    tool_calls?: Array<{
      id: string;
      type: 'function';
      function: {
        name: string;
        arguments: string;
      };
    }>;
  };
  finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}

interface OpenRouterResponse {
  model?: string;
  choices?: OpenRouterChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
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
 * Convert messages with content blocks to OpenAI format
 */
function convertMessagesToOpenAIFormat(messages: Message[]): OpenAIMessage[] {
  return messages.map(msg => {
    // If content is a string, just return as-is
    if (typeof msg.content === 'string') {
      return {
        role: msg.role,
        content: msg.content,
      } as OpenAITextMessage;
    }

    // If content is an array of blocks, we need to convert based on type
    const blocks = msg.content as ContentBlock[];

    // Check if this is an assistant message with tool uses
    const hasToolUse = blocks.some(b => b.type === 'tool_use');
    if (hasToolUse && msg.role === 'assistant') {
      // Convert to OpenAI format with tool_calls
      const textBlocks = blocks.filter(b => b.type === 'text');
      const toolBlocks = blocks.filter(b => b.type === 'tool_use');

      return {
        role: 'assistant',
        content: textBlocks.map(b => b.text).join('\n') || null,
        tool_calls: toolBlocks.map(b => ({
          id: b.id!,
          type: 'function' as const,
          function: {
            name: b.name!,
            arguments: JSON.stringify(b.input),
          },
        })),
      } as OpenAIAssistantToolCallMessage;
    }

    // Check if this is a user message with tool results
    const hasToolResult = blocks.some(b => b.type === 'tool_result');
    if (hasToolResult && msg.role === 'user') {
      // Convert to OpenAI format with role: 'tool'
      return blocks.map(b => ({
        role: 'tool' as const,
        tool_call_id: b.tool_use_id!,
        content: b.content!,
      } as OpenAIToolMessage));
    }

    // Otherwise, extract text
    const text = blocks
      .filter(b => b.type === 'text' && b.text)
      .map(b => b.text)
      .join('\n\n');

    return {
      role: msg.role,
      content: text,
    } as OpenAITextMessage;
  }).flat(); // Flat because tool results return arrays
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

  // Convert messages to OpenAI format
  const openAIMessages = convertMessagesToOpenAIFormat(messages);

  const requestBody: Record<string, unknown> = {
    model: model || 'anthropic/claude-sonnet-4.5',
    messages: openAIMessages,
    max_tokens: maxTokens,
  };

  // Add system prompt if provided
  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }

  // Add tools if provided (already in OpenAI format)
  if (tools && tools.length > 0) {
    requestBody.tools = tools;
  }

  // Log request for debugging
  console.log('[OpenRouter] Request:', {
    model: requestBody.model,
    hasSystem: !!requestBody.system,
    hasTools: (requestBody.tools as Tool[] | undefined)?.length || 0,
    toolNames: (requestBody.tools as Tool[] | undefined)?.map(t => t.function.name) || [],
    messageCount: openAIMessages.length,
    lastMessage: openAIMessages[openAIMessages.length - 1],
  });

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

    console.log('[OpenRouter] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[OpenRouter] Error response:', errorData);
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || JSON.stringify(errorData)
        }`
      );
    }

    // Get raw response text first for debugging
    const responseText = await response.text();
    console.log('[OpenRouter] Raw response length:', responseText.length);

    if (!responseText || responseText.length === 0) {
      throw new Error('Empty response from OpenRouter API');
    }

    // Try to parse JSON
    let data: OpenRouterResponse;
    try {
      data = JSON.parse(responseText) as OpenRouterResponse;
    } catch (parseError) {
      console.error('[OpenRouter] JSON parse error. First 500 chars of response:', responseText.substring(0, 500));
      throw new Error(`Failed to parse OpenRouter response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
    }
    console.log('[OpenRouter] Response data:', {
      model: data.model,
      finishReason: data.choices?.[0]?.finish_reason,
      hasToolCalls: !!data.choices?.[0]?.message?.tool_calls,
      toolCalls: data.choices?.[0]?.message?.tool_calls?.map(tc => ({
        name: tc.function.name,
        argsLength: tc.function.arguments.length,
      })) || [],
      contentLength: typeof data.choices?.[0]?.message?.content === 'string'
        ? data.choices[0].message.content.length
        : 0,
    });

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

    // Check for max_tokens BEFORE trying to parse tool calls
    if (choice.finish_reason === 'length') {
      stopReason = 'max_tokens';
      console.warn('[OpenRouter] Response truncated due to max_tokens limit');
      // Don't try to parse tool calls if response was truncated
    } else if (choice.finish_reason === 'tool_calls' || choice.message?.tool_calls) {
      stopReason = 'tool_use';

      // Convert OpenRouter tool_calls format to Anthropic format
      if (choice.message?.tool_calls) {
        content = choice.message.tool_calls.map(tc => {
          try {
            return {
              type: 'tool_use' as const,
              id: tc.id,
              name: tc.function.name,
              input: typeof tc.function.arguments === 'string'
                ? JSON.parse(tc.function.arguments) as Record<string, unknown>
                : tc.function.arguments,
            };
          } catch (parseError) {
            console.error('[OpenRouter] Failed to parse tool call arguments:', parseError);
            console.error('[OpenRouter] Tool call data:', tc);
            throw new Error(`Failed to parse tool call arguments for ${tc.function.name}: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`);
          }
        });
      }
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
