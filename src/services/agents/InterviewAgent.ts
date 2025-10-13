/**
 * Interview Agent
 * Conducts conversational interviews to gather context for subjects and courses
 */

import { Agent } from './Agent';
import type { Tool } from '../api/openrouter';
import type { HierarchicalContext } from '../../types/context';
import type { SubjectInterviewResult, CourseInterviewResult } from '../../types/agent';

/**
 * Interview Agent for gathering subject/course context
 */
export class InterviewAgent extends Agent {
  private interviewType: 'subject' | 'course';
  private interviewResult: SubjectInterviewResult | CourseInterviewResult | null = null;

  constructor(interviewType: 'subject' | 'course', model?: string) {
    super(model);
    this.interviewType = interviewType;
  }

  protected getSystemPrompt(context: Partial<HierarchicalContext>): string {
    if (this.interviewType === 'subject') {
      return `You are conducting an interview to understand what subject the learner wants to study.

User Context: ${JSON.stringify(context.user || {}, null, 2)}

Your job:
1. Ask 3-5 focused questions to understand:
   - What specifically they want to learn
   - What tools/hardware/resources they have available (if relevant to the subject)
   - Their background knowledge in related areas
   - Their learning goals and motivations

2. Be conversational, friendly, and adaptive:
   - Ask one question at a time
   - Build on their previous answers
   - Show enthusiasm for their learning goals
   - Keep the conversation natural and engaging

3. When you have enough information, use the complete_subject_interview tool:
   - Extract a clear, concise subject name
   - Create a comprehensive subject context JSON with relevant fields
   - Include information about tools, hardware, background, goals, etc.

Important guidelines:
- Keep questions focused and relevant to understanding the subject
- Don't ask unnecessary questions if they've already provided the information
- The subject context should be flexible - include fields that are relevant to THIS specific subject
- For technical subjects, ask about their development environment, tools, hardware
- For creative subjects, ask about their experience level and what they want to create
- Adapt your questions based on their experience level

Remember: You're helping them start a learning journey, so be encouraging and supportive!`;
    } else {
      return `You are conducting an interview to design a personalized course.

Full Context: ${JSON.stringify(context, null, 2)}

You already know:
- The subject they're studying: ${context.subject?.subjectName || 'Unknown'}
- Their available tools/resources
- Their background knowledge
- Their general learning preferences

Your job:
1. Ask 5-8 focused questions to understand THIS specific course:
   - Specific learning objectives for this course
   - Current knowledge level on this particular topic
   - Preferred balance of theory vs. hands-on practice
   - Time commitment per session
   - End goal or specific project they want to build
   - Any particular challenges they want to overcome

2. Be conversational and adaptive:
   - Ask one question at a time
   - Build on their previous answers
   - Reference their existing context when relevant
   - Keep the conversation engaging

3. When you have enough information, use the complete_course_interview tool:
   - Extract a clear, descriptive course name
   - Create a comprehensive course context JSON with relevant fields
   - Include specific goals, prerequisites, time commitment, etc.

Important guidelines:
- Focus on THIS specific course, not general subject knowledge
- Don't repeat questions about information you already have in the context
- The course context should capture what makes THIS course unique
- Be specific about learning objectives and outcomes
- Ask about their preferred learning style for this topic

Remember: This course should be tailored to their specific needs and goals!`;
    }
  }

  protected getTools(): Tool[] {
    if (this.interviewType === 'subject') {
      return [
        {
          name: 'complete_subject_interview',
          description: 'Call this when you have gathered sufficient information about the subject. This completes the interview.',
          input_schema: {
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
      ];
    } else {
      return [
        {
          name: 'complete_course_interview',
          description: 'Call this when you have gathered sufficient information about the course. This completes the interview.',
          input_schema: {
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
      ];
    }
  }

  protected async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    _context: Partial<HierarchicalContext>
  ): Promise<string | Record<string, unknown>> {
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
   * Check if the interview is complete
   */
  isComplete(): boolean {
    return this.interviewResult !== null;
  }
}
