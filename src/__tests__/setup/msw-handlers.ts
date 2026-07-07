import { http, HttpResponse } from 'msw';

// OpenRouter API base URL
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

interface ChatCompletionRequestBody {
  tools?: Array<{
    type: 'function';
    function: { name: string };
  }>;
}

export const handlers = [
  // Mock OpenRouter chat completions endpoint
  http.post(`${OPENROUTER_API_URL}/chat/completions`, async ({ request }) => {
    const body = await request.json() as ChatCompletionRequestBody;

    // Check if the request includes tools
    const hasTools = body.tools && body.tools.length > 0;

    if (hasTools && body.tools) {
      const toolName = body.tools[0].function.name;

      // Mock tool use response
      return HttpResponse.json({
        id: 'test-response-id',
        model: 'anthropic/claude-sonnet-4.6',
        choices: [
          {
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'test-tool-call-id',
                  name: toolName,
                  input: { test: 'data' },
                },
              ],
              tool_calls: [
                {
                  id: 'test-tool-call-id',
                  type: 'function',
                  function: {
                    name: toolName,
                    arguments: JSON.stringify({ test: 'data' }),
                  },
                },
              ],
            },
            finish_reason: 'tool_use',
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      });
    }

    // Mock regular text response
    return HttpResponse.json({
      id: 'test-response-id',
      model: 'anthropic/claude-sonnet-4.6',
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'This is a mock AI response for testing purposes.',
          },
          finish_reason: 'end_turn',
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    });
  }),
];
