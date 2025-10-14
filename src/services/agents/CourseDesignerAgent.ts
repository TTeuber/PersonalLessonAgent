/**
 * Course Designer Agent
 * Creates structured course outlines with lessons, exercises, and quizzes
 */

import { Agent } from './Agent';
import type { Tool } from '../api/openrouter';
import type { HierarchicalContext } from '../../types/context';
import type { CourseOutline } from '../../types/agent';

/**
 * Course Designer Agent for creating course structures
 */
export class CourseDesignerAgent extends Agent {
  private courseOutline: CourseOutline | null = null;

  protected getSystemPrompt(_context: HierarchicalContext): string {
    return `You are an expert instructional designer creating personalized course curricula.

When given interview data about a learner and their course goals, your task is to design a structured course outline that is:

1. **Tailored to the learner:**
   - Consider their background knowledge and goals
   - Respect their learning style preference (hands-on, theory-first, or balanced)
   - Use their available tools/resources
   - Align with their specific course goals

2. **Well-structured:**
   - Create at least 5 modules (no upper limit - create as many as needed)
   - Start with foundational concepts
   - Build progressively to advanced topics
   - End with a practical application or project

3. **Balanced content types:**
   - Mix lessons (theory), exercises (practice), and quizzes (assessment)
   - For "hands-on" learners: More exercises, shorter lessons
   - For "theory-first" learners: More comprehensive lessons, then practice
   - For "balanced" learners: Equal mix of theory and practice

4. **Practical and engaging:**
   - Each module should have a clear learning objective
   - Exercises should build real, useful projects
   - Quizzes should reinforce key concepts
   - Reference actual tools/hardware they have

Module ordering guidelines:
- order: 0 is the first module, 1 is second, etc.
- Lessons typically come before related exercises
- Quizzes typically come after a set of related lessons/exercises
- A typical pattern: Lesson → Exercise → Lesson → Exercise → Quiz

When you're ready, use the create_course_outline tool to submit your design.`;
  }

  protected getTools(): Tool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'create_course_outline',
          description: 'Create the complete course structure with all modules',
          parameters: {
            type: 'object',
            properties: {
              modules: {
                type: 'array',
                description: 'Array of module outlines in sequential order',
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['lesson', 'exercise', 'quiz'],
                      description: 'The type of module',
                    },
                    title: {
                      type: 'string',
                      description: 'Clear, descriptive title for the module',
                    },
                    description: {
                      type: 'string',
                      description: 'Detailed description of what this module covers and its learning objectives',
                    },
                    order: {
                      type: 'number',
                      description: 'Sequential order (0-indexed). First module is 0, second is 1, etc.',
                    },
                  },
                  required: ['type', 'title', 'description', 'order'],
                },
              },
            },
            required: ['modules'],
          },
        },
      },
    ];
  }

  protected async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    _context: Partial<HierarchicalContext>
  ): Promise<string | Record<string, unknown>> {
    if (toolName === 'create_course_outline') {
      const modules = input.modules as Array<{
        type: 'lesson' | 'exercise' | 'quiz';
        title: string;
        description: string;
        order: number;
      }>;

      // Validate modules
      if (!Array.isArray(modules) || modules.length === 0) {
        throw new Error('Modules must be a non-empty array');
      }

      if (modules.length < 5) {
        throw new Error('Course must have at least 5 modules');
      }

      // Validate each module
      for (const module of modules) {
        if (!module.type || !['lesson', 'exercise', 'quiz'].includes(module.type)) {
          throw new Error(`Invalid module type: ${module.type}`);
        }
        if (!module.title || module.title.trim().length === 0) {
          throw new Error('Each module must have a non-empty title');
        }
        if (!module.description || module.description.trim().length === 0) {
          throw new Error('Each module must have a non-empty description');
        }
        if (typeof module.order !== 'number' || module.order < 0) {
          throw new Error(`Invalid module order: ${module.order}`);
        }
      }

      // Sort modules by order
      modules.sort((a, b) => a.order - b.order);

      // Store the outline
      this.courseOutline = { modules };

      return {
        success: true,
        message: `Course outline created successfully with ${modules.length} modules!`,
        moduleCount: modules.length,
      };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }

  /**
   * Get the course outline after generation
   */
  getCourseOutline(): CourseOutline | null {
    return this.courseOutline;
  }

  /**
   * Check if course design is complete
   */
  isComplete(): boolean {
    return this.courseOutline !== null;
  }
}
