/**
 * CourseDesignerAgent Tests
 * Tests for course structure generation
 */

import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { CourseDesignerAgent } from './CourseDesignerAgent';
import { mockHierarchicalContext } from '../../__tests__/fixtures/context-fixtures';

// Create MSW server
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CourseDesignerAgent', () => {
  describe('getTools', () => {
    it('should return create_course_outline tool with correct schema', () => {
      const agent = new CourseDesignerAgent();
      const tools = agent['getTools'](); // Access protected method for testing

      expect(tools).toHaveLength(1);
      expect(tools[0]).toMatchObject({
        type: 'function',
        function: {
          name: 'create_course_outline',
          description: expect.any(String),
          parameters: {
            type: 'object',
            properties: {
              modules: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: expect.objectContaining({ enum: ['lesson', 'exercise', 'quiz'] }),
                    title: { type: 'string' },
                    description: { type: 'string' },
                    order: { type: 'number' },
                  },
                  required: ['type', 'title', 'description', 'order'],
                },
              },
            },
            required: ['modules'],
          },
        },
      });
    });
  });

  describe('executeTool', () => {
    it('should create course outline with valid modules', async () => {
      const agent = new CourseDesignerAgent();
      const validModules = [
        {
          type: 'lesson',
          title: 'Introduction',
          description: 'Learn the basics',
          order: 0,
        },
        {
          type: 'exercise',
          title: 'Practice',
          description: 'Hands-on practice',
          order: 1,
        },
        {
          type: 'quiz',
          title: 'Assessment',
          description: 'Test your knowledge',
          order: 2,
        },
        {
          type: 'lesson',
          title: 'Advanced Topics',
          description: 'Dive deeper',
          order: 3,
        },
        {
          type: 'exercise',
          title: 'Final Project',
          description: 'Build something real',
          order: 4,
        },
      ];

      const result = await agent['executeTool'](
        'create_course_outline',
        { modules: validModules },
        mockHierarchicalContext
      );

      expect(result).toMatchObject({
        success: true,
        message: expect.stringContaining('5 modules'),
        moduleCount: 5,
      });

      const outline = agent.getCourseOutline();
      expect(outline).not.toBeNull();
      expect(outline?.modules).toHaveLength(5);
      expect(outline?.modules[0]).toMatchObject(validModules[0]);
    });

    it('should reject course with too few modules', async () => {
      const agent = new CourseDesignerAgent();
      const tooFewModules = [
        {
          type: 'lesson',
          title: 'Only One',
          description: 'Not enough',
          order: 0,
        },
      ];

      await expect(
        agent['executeTool']('create_course_outline', { modules: tooFewModules }, mockHierarchicalContext)
      ).rejects.toThrow('Course must have between 5 and 10 modules');
    });

    it('should reject course with too many modules', async () => {
      const agent = new CourseDesignerAgent();
      const tooManyModules = Array.from({ length: 11 }, (_, i) => ({
        type: 'lesson',
        title: `Module ${i}`,
        description: `Description ${i}`,
        order: i,
      }));

      await expect(
        agent['executeTool']('create_course_outline', { modules: tooManyModules }, mockHierarchicalContext)
      ).rejects.toThrow('Course must have between 5 and 10 modules');
    });

    it('should reject module with invalid type', async () => {
      const agent = new CourseDesignerAgent();
      const invalidModules = [
        {
          type: 'invalid-type',
          title: 'Test',
          description: 'Test',
          order: 0,
        },
        // Add 4 more valid modules to meet minimum requirement
        ...Array.from({ length: 4 }, (_, i) => ({
          type: 'lesson',
          title: `Module ${i}`,
          description: `Description ${i}`,
          order: i + 1,
        })),
      ];

      await expect(
        agent['executeTool']('create_course_outline', { modules: invalidModules }, mockHierarchicalContext)
      ).rejects.toThrow('Invalid module type');
    });

    it('should sort modules by order', async () => {
      const agent = new CourseDesignerAgent();
      const unorderedModules = [
        { type: 'lesson', title: 'Third', description: 'Test', order: 2 },
        { type: 'lesson', title: 'First', description: 'Test', order: 0 },
        { type: 'lesson', title: 'Fifth', description: 'Test', order: 4 },
        { type: 'lesson', title: 'Second', description: 'Test', order: 1 },
        { type: 'lesson', title: 'Fourth', description: 'Test', order: 3 },
      ];

      await agent['executeTool']('create_course_outline', { modules: unorderedModules }, mockHierarchicalContext);

      const outline = agent.getCourseOutline();
      expect(outline?.modules[0].title).toBe('First');
      expect(outline?.modules[1].title).toBe('Second');
      expect(outline?.modules[2].title).toBe('Third');
      expect(outline?.modules[3].title).toBe('Fourth');
      expect(outline?.modules[4].title).toBe('Fifth');
    });
  });

  describe('run method - integration with API', () => {
    it('should successfully generate course outline when AI calls tool', async () => {
      // Mock API response that calls the create_course_outline tool
      server.use(
        http.post('https://openrouter.ai/api/v1/chat/completions', async () => {
          return HttpResponse.json({
            id: 'test-response',
            model: 'anthropic/claude-sonnet-4.5',
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [
                    {
                      id: 'tool-call-1',
                      type: 'function',
                      function: {
                        name: 'create_course_outline',
                        arguments: JSON.stringify({
                          modules: [
                            {
                              type: 'lesson',
                              title: 'Introduction to Testing',
                              description: 'Learn the fundamentals of testing',
                              order: 0,
                            },
                            {
                              type: 'exercise',
                              title: 'Write Your First Test',
                              description: 'Practice writing unit tests',
                              order: 1,
                            },
                            {
                              type: 'lesson',
                              title: 'Advanced Testing Patterns',
                              description: 'Explore mocking and fixtures',
                              order: 2,
                            },
                            {
                              type: 'exercise',
                              title: 'Build a Test Suite',
                              description: 'Create comprehensive test coverage',
                              order: 3,
                            },
                            {
                              type: 'quiz',
                              title: 'Testing Knowledge Check',
                              description: 'Assess your understanding',
                              order: 4,
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
              prompt_tokens: 500,
              completion_tokens: 200,
              total_tokens: 700,
            },
          });
        })
      );

      // Mock the second API call (after tool execution) that returns end_turn
      let callCount = 0;
      server.use(
        http.post('https://openrouter.ai/api/v1/chat/completions', async () => {
          callCount++;
          if (callCount === 1) {
            // First call: tool use
            return HttpResponse.json({
              choices: [
                {
                  message: {
                    tool_calls: [
                      {
                        id: 'tool-1',
                        type: 'function',
                        function: {
                          name: 'create_course_outline',
                          arguments: JSON.stringify({
                            modules: [
                              { type: 'lesson', title: 'Intro', description: 'Test', order: 0 },
                              { type: 'exercise', title: 'Practice', description: 'Test', order: 1 },
                              { type: 'lesson', title: 'Advanced', description: 'Test', order: 2 },
                              { type: 'exercise', title: 'Project', description: 'Test', order: 3 },
                              { type: 'quiz', title: 'Assessment', description: 'Test', order: 4 },
                            ],
                          }),
                        },
                      },
                    ],
                  },
                  finish_reason: 'tool_calls',
                },
              ],
              usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
            });
          } else {
            // Second call: end turn with confirmation text
            return HttpResponse.json({
              choices: [
                {
                  message: {
                    role: 'assistant',
                    content: 'Course outline created successfully!',
                  },
                  finish_reason: 'stop',
                },
              ],
              usage: { prompt_tokens: 50, completion_tokens: 10, total_tokens: 60 },
            });
          }
        })
      );

      const agent = new CourseDesignerAgent();
      const response = await agent.run(
        'Design a course structure based on the interview.',
        mockHierarchicalContext
      );

      expect(response.text).toBeTruthy();
      expect(response.stopReason).toBe('stop_sequence');

      const outline = agent.getCourseOutline();
      expect(outline).not.toBeNull();
      expect(outline?.modules).toHaveLength(5);
    });

    it('should handle case where AI does not call tool', async () => {
      // Mock API response that does NOT call tool (just returns text)
      server.use(
        http.post('https://openrouter.ai/api/v1/chat/completions', async () => {
          return HttpResponse.json({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'I need more information before creating a course outline.',
                },
                finish_reason: 'stop',
              },
            ],
            usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 },
          });
        })
      );

      const agent = new CourseDesignerAgent();
      const response = await agent.run('Design a course.', mockHierarchicalContext);

      expect(response.text).toContain('more information');
      expect(agent.getCourseOutline()).toBeNull();
      expect(agent.isComplete()).toBe(false);
    });
  });

  describe('isComplete', () => {
    it('should return false when no outline has been generated', () => {
      const agent = new CourseDesignerAgent();
      expect(agent.isComplete()).toBe(false);
    });

    it('should return true after outline is generated', async () => {
      const agent = new CourseDesignerAgent();
      const modules = [
        { type: 'lesson', title: 'Test 1', description: 'Test', order: 0 },
        { type: 'lesson', title: 'Test 2', description: 'Test', order: 1 },
        { type: 'lesson', title: 'Test 3', description: 'Test', order: 2 },
        { type: 'lesson', title: 'Test 4', description: 'Test', order: 3 },
        { type: 'lesson', title: 'Test 5', description: 'Test', order: 4 },
      ];

      await agent['executeTool']('create_course_outline', { modules }, mockHierarchicalContext);
      expect(agent.isComplete()).toBe(true);
    });
  });
});
