/**
 * CourseDesignerAgent Integration Tests
 * Simulates the real-world flow from SubjectView
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { CourseDesignerAgent } from './CourseDesignerAgent';
import { mockUserContext, mockSubjectContext } from '../../__tests__/fixtures/context-fixtures';
import type { HierarchicalContext, CourseContext } from '../../types/context';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CourseDesignerAgent - SubjectView Integration', () => {
  it('should create course outline from interview results (simulating SubjectView flow)', async () => {
    // Simulate the context built in SubjectView.tsx designCourse()
    const courseName = 'Test-Driven Development Fundamentals';
    const courseContext = {
      goal: 'Learn how to write effective unit tests and practice TDD',
      prerequisitesCovered: 'Basic JavaScript programming',
      timeCommitment: '2 weeks',
      learningStyle: 'hands-on',
      projectIdea: 'Build a tested calculator library',
    };

    // This mimics lines 111-117 in SubjectView.tsx
    const context: Partial<HierarchicalContext> = {
      user: mockUserContext,
      subject: mockSubjectContext,
      course: {
        courseName,
        courseId: 'test-driven-development-fundamentals',
        ...courseContext,
      } as CourseContext,
    };

    console.log('Test context:', JSON.stringify(context, null, 2));

    // Mock realistic API responses
    let callCount = 0;
    server.use(
      http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => {
        callCount++;
        const body = await request.json() as any;

        console.log(`API Call ${callCount}:`, {
          hasTools: body.tools?.length > 0,
          toolNames: body.tools?.map((t: any) => t.function.name),
          systemPrompt: body.system?.substring(0, 100) + '...',
          userMessage: body.messages[body.messages.length - 1],
        });

        if (callCount === 1) {
          // First call: AI decides to use the create_course_outline tool
          return HttpResponse.json({
            id: 'chatcmpl-test',
            model: 'anthropic/claude-sonnet-4.5',
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'call_abc123',
                      type: 'function',
                      function: {
                        name: 'create_course_outline',
                        arguments: JSON.stringify({
                          modules: [
                            {
                              type: 'lesson',
                              title: 'Introduction to Test-Driven Development',
                              description: 'Understand TDD principles, benefits, and the red-green-refactor cycle',
                              order: 0,
                            },
                            {
                              type: 'lesson',
                              title: 'Writing Your First Unit Test',
                              description: 'Learn test structure, assertions, and basic testing patterns',
                              order: 1,
                            },
                            {
                              type: 'exercise',
                              title: 'Build a Calculator with Tests',
                              description: 'Create a calculator library using TDD from scratch',
                              order: 2,
                            },
                            {
                              type: 'lesson',
                              title: 'Mocking and Test Doubles',
                              description: 'Learn when and how to use mocks, stubs, and spies',
                              order: 3,
                            },
                            {
                              type: 'exercise',
                              title: 'Test a Module with Dependencies',
                              description: 'Practice mocking external dependencies in your tests',
                              order: 4,
                            },
                            {
                              type: 'quiz',
                              title: 'TDD Knowledge Assessment',
                              description: 'Test your understanding of TDD concepts and practices',
                              order: 5,
                            },
                          ],
                        }),
                      },
                    },
                  ],
                },
                finish_reason: 'tool_calls',
              },
            ],
            usage: {
              prompt_tokens: 650,
              completion_tokens: 350,
              total_tokens: 1000,
            },
          });
        } else {
          // Second call: AI acknowledges the tool result
          return HttpResponse.json({
            id: 'chatcmpl-test-2',
            model: 'anthropic/claude-sonnet-4.5',
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'I have created a comprehensive TDD course with 6 modules covering theory, practice, and assessment.',
                },
                finish_reason: 'stop',
              },
            ],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 25,
              total_tokens: 125,
            },
          });
        }
      })
    );

    // Execute the same flow as SubjectView.tsx lines 119-125
    const designer = new CourseDesignerAgent();
    const response = await designer.run(
      'Design a course structure based on the interview.',
      context as any
    );

    console.log('Designer response:', {
      text: response.text,
      stopReason: response.stopReason,
      hasOutline: designer.getCourseOutline() !== null,
    });

    const outline = designer.getCourseOutline();

    // Assertions matching SubjectView.tsx logic
    expect(outline, 'Course outline should not be null').not.toBeNull();
    expect(outline?.modules, 'Should have modules').toBeDefined();
    expect(outline?.modules.length, 'Should have 6 modules').toBe(6);
    expect(designer.isComplete(), 'Designer should be complete').toBe(true);
  });

  it('should fail gracefully when context is missing required fields', async () => {
    // Test with incomplete context
    const incompleteContext: Partial<HierarchicalContext> = {
      user: mockUserContext,
      // Missing subject and course
    };

    server.use(
      http.post('https://openrouter.ai/api/v1/chat/completions', async () => {
        return HttpResponse.json({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'I need more context about the subject and course goals to create a proper outline.',
              },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
        });
      })
    );

    const designer = new CourseDesignerAgent();
    const response = await designer.run('Design a course structure.', incompleteContext);

    expect(response.text).toContain('need more context');
    expect(designer.getCourseOutline()).toBeNull();
  });

  it('should detect when API returns error', async () => {
    const context: Partial<HierarchicalContext> = {
      user: mockUserContext,
      subject: mockSubjectContext,
      course: {
        courseName: 'Test Course',
        courseId: 'test-course',
        goal: 'Learn testing',
      } as CourseContext,
    };

    // Simulate API error
    server.use(
      http.post('https://openrouter.ai/api/v1/chat/completions', async () => {
        return HttpResponse.json(
          {
            error: {
              message: 'Insufficient credits',
              type: 'insufficient_quota',
            },
          },
          { status: 429 }
        );
      })
    );

    const designer = new CourseDesignerAgent();
    await expect(
      designer.run('Design a course structure.', context)
    ).rejects.toThrow(/OpenRouter API error.*429/);
  });
});
