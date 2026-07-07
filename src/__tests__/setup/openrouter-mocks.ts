import { http, HttpResponse } from 'msw';

/**
 * Builders for scripting multi-turn OpenRouter conversations in tests.
 *
 * The agents drive a tool-use loop: the model responds with a tool call,
 * the agent executes it and reports the result, and the model then responds
 * with text. These helpers produce OpenAI-format responses (what OpenRouter
 * actually returns) so a test can replay that exchange step by step.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

const MOCK_USAGE = {
  prompt_tokens: 100,
  completion_tokens: 50,
  total_tokens: 150,
};

/**
 * An assistant message that invokes a single tool with the given arguments
 */
export function toolCallResponse(name: string, args: Record<string, unknown>) {
  return {
    id: 'mock-response-id',
    model: 'anthropic/claude-sonnet-4.6',
    choices: [
      {
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: `mock-tool-call-${name}`,
              type: 'function',
              function: {
                name,
                arguments: JSON.stringify(args),
              },
            },
          ],
        },
        finish_reason: 'tool_calls',
      },
    ],
    usage: MOCK_USAGE,
  };
}

/**
 * A plain text assistant message that ends the agent's tool-use loop
 */
export function textResponse(text: string) {
  return {
    id: 'mock-response-id',
    model: 'anthropic/claude-sonnet-4.6',
    choices: [
      {
        message: {
          role: 'assistant',
          content: text,
        },
        finish_reason: 'stop',
      },
    ],
    usage: MOCK_USAGE,
  };
}

/**
 * MSW handler that replays a fixed sequence of responses, one per request.
 * If the agent makes more requests than scripted, the last response repeats.
 */
export function chatCompletionSequence(responses: Array<Record<string, unknown>>) {
  let call = 0;
  return http.post(`${OPENROUTER_API_URL}/chat/completions`, () => {
    const response = responses[Math.min(call, responses.length - 1)];
    call++;
    return HttpResponse.json(response);
  });
}
