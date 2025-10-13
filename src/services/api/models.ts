/**
 * AI Model Configurations
 * Defines available models and their settings for different use cases
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  description: string;
}

/**
 * Available AI models
 */
export const MODELS = {
  // Claude Sonnet 4 - Best balance of intelligence and speed
  CLAUDE_SONNET_4: {
    id: 'anthropic/claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    description: 'Optimal balance of intelligence, speed, and cost. Best for interviews and content generation.',
  },

  // Claude Opus - Highest intelligence (if needed for complex tasks)
  CLAUDE_OPUS_4: {
    id: 'anthropic/claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    description: 'Maximum intelligence for complex course design and advanced tutoring.',
  },

  // Claude Haiku - Faster, cheaper (for simple tasks)
  CLAUDE_HAIKU_4: {
    id: 'anthropic/claude-haiku-4-20250514',
    name: 'Claude Haiku 4',
    provider: 'Anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    description: 'Fast and efficient for simple Q&A and quick responses.',
  },
} as const;

/**
 * Default model for most operations
 */
export const DEFAULT_MODEL = MODELS.CLAUDE_SONNET_4.id;

/**
 * Model selection by use case
 */
export const MODEL_BY_USE_CASE = {
  interview: MODELS.CLAUDE_SONNET_4.id,
  courseDesign: MODELS.CLAUDE_SONNET_4.id,
  contentGeneration: MODELS.CLAUDE_SONNET_4.id,
  tutoring: MODELS.CLAUDE_SONNET_4.id,
  quickChat: MODELS.CLAUDE_HAIKU_4.id,
} as const;

/**
 * Get model config by ID
 */
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return Object.values(MODELS).find(model => model.id === modelId);
}

/**
 * Get model for specific use case
 */
export function getModelForUseCase(useCase: keyof typeof MODEL_BY_USE_CASE): string {
  return MODEL_BY_USE_CASE[useCase];
}
