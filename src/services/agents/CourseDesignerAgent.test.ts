import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { CourseDesignerAgent } from './CourseDesignerAgent';
import {
  chatCompletionSequence,
  toolCallResponse,
  textResponse,
} from '../../__tests__/setup/openrouter-mocks';
import { mockHierarchicalContext } from '../../__tests__/fixtures/context-fixtures';

const server = setupServer();

const validModules = [
  { type: 'exercise', title: 'Final Project', description: 'Build a complete app', order: 5 },
  { type: 'lesson', title: 'Introduction', description: 'Core concepts', order: 0 },
  { type: 'exercise', title: 'First Steps', description: 'Hands-on practice', order: 2 },
  { type: 'lesson', title: 'State Management', description: 'Managing state', order: 1 },
  { type: 'quiz', title: 'Checkpoint', description: 'Assess understanding', order: 3 },
  { type: 'lesson', title: 'Advanced Patterns', description: 'Deep dive', order: 4 },
];

describe('CourseDesignerAgent', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('stores the course outline sorted by module order', async () => {
    server.use(
      chatCompletionSequence([
        toolCallResponse('create_course_outline', { modules: validModules }),
        textResponse('I have designed your course.'),
      ])
    );

    const agent = new CourseDesignerAgent();
    expect(agent.isComplete()).toBe(false);

    const response = await agent.run('Design a course from this interview data.', mockHierarchicalContext);

    expect(response.text).toBe('I have designed your course.');
    expect(agent.isComplete()).toBe(true);

    const outline = agent.getCourseOutline();
    expect(outline).not.toBeNull();
    expect(outline!.modules).toHaveLength(6);
    expect(outline!.modules.map(m => m.order)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(outline!.modules[0].title).toBe('Introduction');
    expect(outline!.modules[5].title).toBe('Final Project');
  });

  it('rejects an outline with fewer than 5 modules', async () => {
    server.use(
      chatCompletionSequence([
        toolCallResponse('create_course_outline', {
          modules: validModules.slice(0, 3),
        }),
        textResponse('I could not create the outline.'),
      ])
    );

    const agent = new CourseDesignerAgent();
    await agent.run('Design a course.', mockHierarchicalContext);

    expect(agent.isComplete()).toBe(false);
    expect(agent.getCourseOutline()).toBeNull();
  });

  it('rejects an outline containing an invalid module type', async () => {
    const modules = [
      ...validModules.slice(0, 5),
      { type: 'video', title: 'Watch This', description: 'A video module', order: 5 },
    ];

    server.use(
      chatCompletionSequence([
        toolCallResponse('create_course_outline', { modules }),
        textResponse('I could not create the outline.'),
      ])
    );

    const agent = new CourseDesignerAgent();
    await agent.run('Design a course.', mockHierarchicalContext);

    expect(agent.getCourseOutline()).toBeNull();
  });

  it('rejects an outline containing a module with an empty title', async () => {
    const modules = [
      ...validModules.slice(0, 5),
      { type: 'lesson', title: '   ', description: 'No title', order: 5 },
    ];

    server.use(
      chatCompletionSequence([
        toolCallResponse('create_course_outline', { modules }),
        textResponse('I could not create the outline.'),
      ])
    );

    const agent = new CourseDesignerAgent();
    await agent.run('Design a course.', mockHierarchicalContext);

    expect(agent.getCourseOutline()).toBeNull();
  });

  it('accepts a valid outline after a rejected attempt in the same run', async () => {
    server.use(
      chatCompletionSequence([
        toolCallResponse('create_course_outline', { modules: validModules.slice(0, 2) }),
        toolCallResponse('create_course_outline', { modules: validModules }),
        textResponse('Second attempt succeeded.'),
      ])
    );

    const agent = new CourseDesignerAgent();
    const response = await agent.run('Design a course.', mockHierarchicalContext);

    expect(response.text).toBe('Second attempt succeeded.');
    expect(agent.isComplete()).toBe(true);
    expect(agent.getCourseOutline()!.modules).toHaveLength(6);
  });
});
