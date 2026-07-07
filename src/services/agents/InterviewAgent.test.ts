import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { InterviewAgent } from './InterviewAgent';
import {
  chatCompletionSequence,
  toolCallResponse,
  textResponse,
} from '../../__tests__/setup/openrouter-mocks';
import {
  mockUserContext,
  mockSubjectContext,
} from '../../__tests__/fixtures/context-fixtures';

const server = setupServer();

describe('InterviewAgent', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('course interviews', () => {
    it('completes the interview when the model calls complete_course_interview', async () => {
      const courseContext = {
        goal: 'Build interactive UIs with React',
        timeCommitment: '5 hours per week',
        projectIdea: 'A habit tracker app',
      };

      server.use(
        chatCompletionSequence([
          toolCallResponse('complete_course_interview', {
            courseName: 'React Fundamentals',
            courseContext,
          }),
          textResponse('The course interview is complete.'),
        ])
      );

      const agent = new InterviewAgent('course');
      const complete = await agent.processAnswers(
        { topic: 'React', experience: 'Some JavaScript, no React' },
        { user: mockUserContext, subject: mockSubjectContext }
      );

      expect(complete).toBe(true);
      expect(agent.isComplete()).toBe(true);
      expect(agent.hasFollowUpQuestions()).toBe(false);
      expect(agent.getInterviewResult()).toEqual({
        courseName: 'React Fundamentals',
        courseContext,
      });
    });

    it('surfaces follow-up questions when the model needs more information', async () => {
      const questions = [
        {
          id: 'followup_1',
          label: 'Which React version will you target?',
          type: 'text',
          required: true,
        },
        {
          id: 'followup_2',
          label: 'How do you prefer to learn?',
          type: 'select',
          required: false,
          options: ['Videos and reading', 'Building projects'],
        },
      ];

      server.use(
        chatCompletionSequence([
          toolCallResponse('generate_follow_up_questions', { questions }),
          textResponse('I have generated follow-up questions.'),
        ])
      );

      const agent = new InterviewAgent('course');
      const complete = await agent.processAnswers(
        { topic: 'React' },
        { user: mockUserContext, subject: mockSubjectContext }
      );

      expect(complete).toBe(false);
      expect(agent.isComplete()).toBe(false);
      expect(agent.hasFollowUpQuestions()).toBe(true);
      expect(agent.getFollowUpQuestions()).toEqual(questions);
      expect(agent.getInterviewResult()).toBeNull();
    });

    it('clears earlier follow-up questions once the interview completes', async () => {
      server.use(
        chatCompletionSequence([
          toolCallResponse('generate_follow_up_questions', {
            questions: [
              { id: 'followup_1', label: 'Which version?', type: 'text', required: true },
            ],
          }),
          textResponse('Follow-up questions generated.'),
        ])
      );

      const agent = new InterviewAgent('course');
      await agent.processAnswers({ topic: 'React' }, { user: mockUserContext });
      expect(agent.hasFollowUpQuestions()).toBe(true);

      server.resetHandlers();
      server.use(
        chatCompletionSequence([
          toolCallResponse('complete_course_interview', {
            courseName: 'React 19 Fundamentals',
            courseContext: { goal: 'Learn React 19' },
          }),
          textResponse('The course interview is complete.'),
        ])
      );

      const complete = await agent.processAnswers(
        { followup_1: 'React 19' },
        { user: mockUserContext }
      );

      expect(complete).toBe(true);
      expect(agent.hasFollowUpQuestions()).toBe(false);
      expect(agent.getInterviewResult()).toMatchObject({
        courseName: 'React 19 Fundamentals',
      });
    });
  });

  describe('subject interviews', () => {
    it('completes the interview when the model calls complete_subject_interview', async () => {
      const subjectContext = {
        tools: 'STM32 Nucleo board, VS Code, PlatformIO',
        experienceLevel: 'intermediate',
        goals: 'Write bare-metal firmware',
      };

      server.use(
        chatCompletionSequence([
          toolCallResponse('complete_subject_interview', {
            subjectName: 'Embedded Development',
            subjectContext,
          }),
          textResponse('The subject interview is complete.'),
        ])
      );

      const agent = new InterviewAgent('subject');
      const complete = await agent.processAnswers(
        { subject: 'Embedded systems', background: 'C programming' },
        { user: mockUserContext }
      );

      expect(complete).toBe(true);
      expect(agent.getInterviewResult()).toEqual({
        subjectName: 'Embedded Development',
        subjectContext,
      });
    });
  });

  describe('error handling', () => {
    it('recovers when the model calls an unknown tool', async () => {
      server.use(
        chatCompletionSequence([
          toolCallResponse('nonexistent_tool', { foo: 'bar' }),
          textResponse('Let me reconsider.'),
        ])
      );

      const agent = new InterviewAgent('course');
      const complete = await agent.processAnswers(
        { topic: 'React' },
        { user: mockUserContext }
      );

      // The tool error is reported back to the model rather than thrown,
      // so the interview simply remains incomplete
      expect(complete).toBe(false);
      expect(agent.getInterviewResult()).toBeNull();
      expect(agent.hasFollowUpQuestions()).toBe(false);
    });
  });
});
