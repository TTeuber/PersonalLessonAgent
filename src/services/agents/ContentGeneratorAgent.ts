/**
 * Content Generator Agent
 * Generates educational content for lessons, exercises, and quizzes
 */

import { Agent } from './Agent';
import type { Tool } from '../api/openrouter';
import type { HierarchicalContext, ModuleContext } from '../../types/context';
import type { QuizQuestion } from '../../types/module';
import { FileSystemService } from '../storage/FileSystemService';
import {
  getModulePath,
  getLessonContentPath,
  getExerciseDescriptionPath,
  getExerciseProjectPath,
  getQuizQuestionsPath,
} from '../storage/DataPaths';

interface ContentGenerationResult extends Record<string, unknown> {
  success: boolean;
  contentPath?: string;
  projectPath?: string;
  message: string;
}

/**
 * Content Generator Agent for creating module content
 */
export class ContentGeneratorAgent extends Agent {
  private fs: FileSystemService;
  private subjectId: string;
  private courseId: string;
  private moduleId: string;

  constructor(fs: FileSystemService, subjectId: string, courseId: string, moduleId: string, model?: string) {
    super(model);
    this.fs = fs;
    this.subjectId = subjectId;
    this.courseId = courseId;
    this.moduleId = moduleId;
  }

  protected getSystemPrompt(context: Partial<HierarchicalContext>): string {
    const moduleContext = context.module as ModuleContext;
    const moduleType = moduleContext?.type || 'unknown';
    const moduleTitle = moduleContext?.title || 'Untitled Module';

    return `You are an expert educational content creator generating high-quality learning materials.

Full Context: ${JSON.stringify(context, null, 2)}

Current Module:
- Type: ${moduleType}
- Title: ${moduleTitle}
- Description: ${moduleContext?.description || 'No description provided'}

Generate content appropriate to the module type:

${moduleType === 'lesson' ? `
**LESSON CONTENT:**
- Use markdown format with clear headings and structure
- Include code examples where relevant
- Use Mermaid diagrams for visualizations (flowcharts, sequence diagrams, etc.)
- Reference specific tools/hardware from the user's context
- Provide clear explanations with practical examples
- Break down complex concepts into digestible sections
- Include a summary at the end

Example Mermaid diagram syntax:
\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`
` : ''}

${moduleType === 'exercise' ? `
**EXERCISE PROJECT:**
- Create realistic project files appropriate to the subject
- Include starter code with clear TODO comments
- Provide a detailed README.md with:
  - Exercise objective
  - Setup instructions
  - Step-by-step tasks
  - Expected outcome
  - Test criteria
- Reference actual tools/hardware the user has
- Make it practical and hands-on
- Include comments explaining key concepts
` : ''}

${moduleType === 'quiz' ? `
**QUIZ QUESTIONS:**
- Create 5-8 questions that test understanding
- Mix question types:
  - multiple-choice (provide 4 options)
  - short-answer (expected answer 1-2 sentences)
  - code-completion (if relevant to subject)
- Questions should reference concepts from previous lessons
- Include clear explanations for each answer
- Make questions progressively challenging
- Avoid trick questions - focus on genuine understanding
` : ''}

Important:
- Tailor content to the user's learning style: ${context.user?.learningStylePreference || 'balanced'}
- Consider their background and prerequisites
- Reference their specific tools and resources
- Make content engaging and practical

When ready, use the appropriate tool to submit your content.`;
  }

  protected getTools(): Tool[] {
    return [
      {
        type: 'function',
        function: {
          name: 'create_lesson_content',
          description: 'Create markdown content for a lesson',
          parameters: {
            type: 'object',
            properties: {
              markdown: {
                type: 'string',
                description: 'Complete lesson content in markdown format',
              },
            },
            required: ['markdown'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_exercise_files',
          description: 'Create exercise project files',
          parameters: {
            type: 'object',
            properties: {
              files: {
                type: 'array',
                description: 'Array of files to create for the exercise project',
                items: {
                  type: 'object',
                  properties: {
                    path: {
                      type: 'string',
                      description: 'Relative path to the file within the project folder (e.g., "src/main.js" or "README.md")',
                    },
                    content: {
                      type: 'string',
                      description: 'Complete content of the file',
                    },
                  },
                  required: ['path', 'content'],
                },
              },
              description: {
                type: 'string',
                description: 'Markdown description of the exercise (shown separately from project files)',
              },
            },
            required: ['files', 'description'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'create_quiz_questions',
          description: 'Create quiz questions with answers and explanations',
          parameters: {
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                description: 'Array of quiz questions',
                items: {
                  type: 'object',
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['multiple-choice', 'short-answer', 'code-completion'],
                      description: 'Type of question',
                    },
                    question: {
                      type: 'string',
                      description: 'The question text',
                    },
                    options: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Answer options (required for multiple-choice, omit for other types)',
                    },
                    correctAnswer: {
                      type: 'string',
                      description: 'The correct answer (option letter for multiple-choice, expected answer for others)',
                    },
                    explanation: {
                      type: 'string',
                      description: 'Explanation of why this is the correct answer',
                    },
                  },
                  required: ['type', 'question', 'correctAnswer', 'explanation'],
                },
              },
            },
            required: ['questions'],
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
    try {
      switch (toolName) {
        case 'create_lesson_content':
          return await this.createLessonContent(input.markdown as string);

        case 'create_exercise_files':
          return await this.createExerciseFiles(
            input.files as Array<{ path: string; content: string }>,
            input.description as string
          );

        case 'create_quiz_questions':
          return await this.createQuizQuestions(input.questions as QuizQuestion[]);

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Create lesson content markdown file
   */
  private async createLessonContent(markdown: string): Promise<ContentGenerationResult> {
    // Ensure module directory exists
    const modulePath = getModulePath(this.subjectId, this.courseId, this.moduleId);
    await this.fs.createDirectory(modulePath);

    // Write content file
    const contentPath = getLessonContentPath(this.subjectId, this.courseId, this.moduleId);
    await this.fs.writeFile(contentPath, markdown);

    return {
      success: true,
      contentPath,
      message: 'Lesson content created successfully',
    };
  }

  /**
   * Create exercise project files
   */
  private async createExerciseFiles(
    files: Array<{ path: string; content: string }>,
    description: string
  ): Promise<ContentGenerationResult> {
    // Ensure module directory exists
    const modulePath = getModulePath(this.subjectId, this.courseId, this.moduleId);
    await this.fs.createDirectory(modulePath);

    // Write description file
    const descriptionPath = getExerciseDescriptionPath(this.subjectId, this.courseId, this.moduleId);
    await this.fs.writeFile(descriptionPath, description);

    // Ensure project directory exists
    const projectPath = getExerciseProjectPath(this.subjectId, this.courseId, this.moduleId);
    await this.fs.createDirectory(projectPath);

    // Write each project file
    for (const file of files) {
      const filePath = `${projectPath}/${file.path}`;
      await this.fs.writeFile(filePath, file.content);
    }

    return {
      success: true,
      contentPath: descriptionPath,
      projectPath,
      message: `Exercise created successfully with ${files.length} project files`,
    };
  }

  /**
   * Create quiz questions JSON file
   */
  private async createQuizQuestions(questions: QuizQuestion[]): Promise<ContentGenerationResult> {
    // Validate questions
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Quiz must have at least one question');
    }

    // Ensure module directory exists
    const modulePath = getModulePath(this.subjectId, this.courseId, this.moduleId);
    await this.fs.createDirectory(modulePath);

    // Write questions file
    const questionsPath = getQuizQuestionsPath(this.subjectId, this.courseId, this.moduleId);
    await this.fs.writeJSON(questionsPath, questions);

    return {
      success: true,
      contentPath: questionsPath,
      message: `Quiz created successfully with ${questions.length} questions`,
    };
  }
}
