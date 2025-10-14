/**
 * Interview Agent
 * Conducts form-based interviews to gather context for subjects and courses
 */

import { Agent } from './Agent';
import type { Tool } from '../api/openrouter';
import type { HierarchicalContext } from '../../types/context';
import type { SubjectInterviewResult, CourseInterviewResult } from '../../types/agent';
import type { Question } from './InitialQuestions';

/**
 * Interview Agent for gathering subject/course context
 */
export class InterviewAgent extends Agent {
  private interviewType: 'subject' | 'course';
  private interviewResult: SubjectInterviewResult | CourseInterviewResult | null = null;
  private followUpQuestions: Question[] | null = null;

  constructor(interviewType: 'subject' | 'course', model?: string) {
    super(model);
    this.interviewType = interviewType;
  }

  protected getSystemPrompt(context: Partial<HierarchicalContext>): string {
    if (this.interviewType === 'subject') {
      return `You are conducting a form-based interview to understand what subject the learner wants to study.

User Context: ${JSON.stringify(context.user || {}, null, 2)}

WORKFLOW:
The learner has already answered initial questions about their subject. You will receive their answers and must decide:

1. If you need MORE information:
   - Use the "generate_follow_up_questions" tool
   - Generate 2-4 targeted follow-up questions based on their answers
   - Each question should be a JSON object with: id, label, type (text/textarea/select), placeholder, required, options (for select), helpText
   - Build on their previous answers to ask relevant follow-ups
   - Focus on clarifying ambiguities or gathering missing details

2. If you have ENOUGH information:
   - Use the "complete_subject_interview" tool
   - Extract a clear, concise subject name from their answers
   - Create a comprehensive subject context JSON with all relevant fields
   - Include: tools, hardware, background, goals, experienceLevel, etc.

QUESTION GENERATION GUIDELINES:
- Only ask questions that will help you create a better learning experience
- Don't ask questions if the information isn't critical
- For technical subjects: ask about development environment, tools, hardware if not provided
- For creative subjects: ask about experience level and what they want to create
- Adapt based on their experience level
- Each question should have a clear purpose

IMPORTANT:
- Don't repeat questions about information already provided
- The subject context should be flexible and adapt to THIS specific subject
- Be efficient - prefer completing the interview if you have sufficient information

Remember: You're helping them start a learning journey!`;
    } else {
      return `You are conducting a form-based interview to design a personalized course.

Full Context: ${JSON.stringify(context, null, 2)}

You already know:
- The subject they're studying: ${context.subject?.subjectName || 'Unknown'}
- Their available tools/resources from subject context
- Their background knowledge
- Their general learning preferences

WORKFLOW:
The learner has already answered initial questions about their course. You will receive their answers and must decide:

1. If you need MORE information:
   - Use the "generate_follow_up_questions" tool
   - Generate 2-4 targeted follow-up questions based on their answers
   - Each question should be a JSON object with: id, label, type (text/textarea/select), placeholder, required, options (for select), helpText
   - Build on their previous answers to ask relevant follow-ups
   - Focus on clarifying their specific goals and needs for THIS course

2. If you have ENOUGH information:
   - Use the "complete_course_interview" tool
   - Extract a clear, descriptive course name from their answers
   - Create a comprehensive course context JSON with all relevant fields
   - Include: goal, prerequisites, timeCommitment, learningStyle, projectIdea, specificChallenges, etc.

QUESTION GENERATION GUIDELINES:
- Only ask questions that will help you design a better course
- Focus on THIS specific course, not general subject knowledge
- Don't repeat questions about information already in the context
- Ask about specific challenges they want to overcome
- Clarify their project goals if mentioned but vague
- Understand their preferred balance of theory vs. practice if not clear

IMPORTANT:
- The course context should capture what makes THIS course unique
- Be specific about learning objectives and outcomes
- Be efficient - prefer completing if you have enough information
- Don't ask more than 2-4 follow-up questions unless absolutely necessary

Remember: This course should be tailored to their specific needs!`;
    }
  }

  protected getTools(): Tool[] {
    const followUpTool: Tool = {
      type: 'function',
      function: {
        name: 'generate_follow_up_questions',
        description: 'Generate follow-up questions based on the answers provided. Use this when you need more information before completing the interview.',
        parameters: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              description: 'Array of follow-up questions to ask',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Unique identifier for the question (e.g., "followup_1", "project_details")',
                  },
                  label: {
                    type: 'string',
                    description: 'The question text to display',
                  },
                  type: {
                    type: 'string',
                    enum: ['text', 'textarea', 'select'],
                    description: 'Input type: text (short), textarea (long), select (dropdown)',
                  },
                  placeholder: {
                    type: 'string',
                    description: 'Placeholder text (optional)',
                  },
                  required: {
                    type: 'boolean',
                    description: 'Whether the question is required',
                  },
                  options: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Options for select type questions',
                  },
                  helpText: {
                    type: 'string',
                    description: 'Helper text to guide the user (optional)',
                  },
                },
                required: ['id', 'label', 'type', 'required'],
              },
            },
          },
          required: ['questions'],
        },
      },
    };

    if (this.interviewType === 'subject') {
      return [
        followUpTool,
        {
          type: 'function',
          function: {
            name: 'complete_subject_interview',
            description: 'Call this when you have gathered sufficient information about the subject. This completes the interview.',
            parameters: {
              type: 'object',
              properties: {
                subjectName: {
                  type: 'string',
                  description: 'A clear, concise name for the subject (e.g., "Embedded Development", "Audio DSP", "Web Development")',
                },
                subjectContext: {
                  type: 'object',
                  description: 'Flexible JSON object containing all relevant information about the subject. Include fields like: tools, hardware, background, goals, experienceLevel, interests, etc. Adapt to what is relevant for THIS specific subject.',
                },
              },
              required: ['subjectName', 'subjectContext'],
            },
          },
        },
      ];
    } else {
      return [
        followUpTool,
        {
          type: 'function',
          function: {
            name: 'complete_course_interview',
            description: 'Call this when you have gathered sufficient information about the course. This completes the interview.',
            parameters: {
              type: 'object',
              properties: {
                courseName: {
                  type: 'string',
                  description: 'A clear, descriptive name for the course (e.g., "ARM Cortex-M Interrupts", "Building Audio Effects", "React Fundamentals")',
                },
                courseContext: {
                  type: 'object',
                  description: 'Flexible JSON object containing all relevant information about the course. Include fields like: goal, prerequisites, timeCommitment, learningStyle, projectIdea, specificChallenges, etc. Adapt to what is relevant for THIS specific course.',
                },
              },
              required: ['courseName', 'courseContext'],
            },
          },
        },
      ];
    }
  }

  protected async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    _context: Partial<HierarchicalContext>
  ): Promise<string | Record<string, unknown>> {
    if (toolName === 'generate_follow_up_questions') {
      this.followUpQuestions = input.questions as Question[];
      return {
        success: true,
        message: 'Follow-up questions generated successfully!',
        questionCount: this.followUpQuestions.length,
      };
    }

    if (toolName === 'complete_subject_interview') {
      const result: SubjectInterviewResult = {
        subjectName: input.subjectName as string,
        subjectContext: input.subjectContext as Record<string, unknown>,
      };
      this.interviewResult = result;
      return {
        success: true,
        message: 'Subject interview completed successfully!',
      };
    }

    if (toolName === 'complete_course_interview') {
      const result: CourseInterviewResult = {
        courseName: input.courseName as string,
        courseContext: input.courseContext as Record<string, unknown>,
      };
      this.interviewResult = result;
      return {
        success: true,
        message: 'Course interview completed successfully!',
      };
    }

    throw new Error(`Unknown tool: ${toolName}`);
  }

  /**
   * Get the interview result after completion
   */
  getInterviewResult(): SubjectInterviewResult | CourseInterviewResult | null {
    return this.interviewResult;
  }

  /**
   * Get generated follow-up questions (if any)
   */
  getFollowUpQuestions(): Question[] | null {
    return this.followUpQuestions;
  }

  /**
   * Check if the interview is complete
   */
  isComplete(): boolean {
    return this.interviewResult !== null;
  }

  /**
   * Check if there are follow-up questions
   */
  hasFollowUpQuestions(): boolean {
    return this.followUpQuestions !== null && this.followUpQuestions.length > 0;
  }

  /**
   * Process form answers and determine next step
   * Returns true if complete, false if more questions needed
   */
  async processAnswers(
    answers: Record<string, string>,
    context: Partial<HierarchicalContext>
  ): Promise<boolean> {
    // Reset follow-up questions
    this.followUpQuestions = null;

    // Format answers as a readable string for the agent
    const answersText = Object.entries(answers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const prompt = `Here are the answers from the learner:\n\n${answersText}\n\nBased on these answers, either generate follow-up questions or complete the interview if you have sufficient information.`;

    await this.run(prompt, context);

    // Interview is complete if we have a result, otherwise check for follow-up questions
    return this.isComplete();
  }
}
