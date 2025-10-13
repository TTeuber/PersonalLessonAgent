import { Agent } from './Agent';
import type { HierarchicalContext } from '../../types/context';
import type { Tool } from '../api/openrouter';

export class TutorAgent extends Agent {
  protected getSystemPrompt(context: HierarchicalContext): string {
    // Build a comprehensive system prompt with full context
    const currentModuleContent = (context.module as any)?.content || '[Content not loaded]';

    return `You are a personalized AI tutor helping the learner understand the current module.

Full Context:
${JSON.stringify(context, null, 2)}

Current Module Content:
${currentModuleContent}

Your role:
- Answer questions about the current lesson/exercise
- Provide hints without giving away answers
- Explain concepts using examples relevant to their tools/hardware
- Be encouraging and supportive
- Reference previous modules if helpful
- Adapt explanations to their learning style (${context.user?.learningStylePreference || 'balanced'})

DO NOT:
- Give complete solutions to exercises immediately
- Go off-topic from the current learning path
- Make assumptions not supported by the context

Keep your responses concise and focused on helping the learner understand the material.`;
  }

  protected getTools(): Tool[] {
    // Tutor typically doesn't need tools, just conversational
    return [];
  }

  protected async executeTool(
    toolName: string,
    _input: Record<string, unknown>,
    _context: Partial<HierarchicalContext>
  ): Promise<string | Record<string, unknown>> {
    // Tutor doesn't use tools, so this should never be called
    throw new Error(`TutorAgent does not support tool execution. Tool: ${toolName}`);
  }
}
