import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { ContentGeneratorAgent } from './ContentGeneratorAgent';
import type { FileSystemService } from '../storage/FileSystemService';
import {
  chatCompletionSequence,
  toolCallResponse,
  textResponse,
} from '../../__tests__/setup/openrouter-mocks';
import {
  mockUserContext,
  mockSubjectContext,
  mockCourseContext,
  mockQuizQuestions,
} from '../../__tests__/fixtures/context-fixtures';

const server = setupServer();

const SUBJECT_ID = 'test-subject';
const COURSE_ID = 'test-course';

function createMockFs() {
  return {
    createDirectory: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    writeJSON: vi.fn().mockResolvedValue(undefined),
  };
}

function contextForModule(moduleId: string, type: 'lesson' | 'exercise' | 'quiz', title: string) {
  return {
    user: mockUserContext,
    subject: mockSubjectContext,
    course: mockCourseContext,
    module: { moduleId, type, title, completed: false },
  };
}

describe('ContentGeneratorAgent', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('writes lesson markdown to the module content file', async () => {
    const markdown = '# Interrupts\n\nAn interrupt is a signal that...';
    server.use(
      chatCompletionSequence([
        toolCallResponse('create_lesson_content', { markdown }),
        textResponse('Lesson generated.'),
      ])
    );

    const fs = createMockFs();
    const agent = new ContentGeneratorAgent(
      fs as unknown as FileSystemService,
      SUBJECT_ID,
      COURSE_ID,
      'lesson-01-interrupts'
    );

    const response = await agent.run(
      'Create a lesson.',
      contextForModule('lesson-01-interrupts', 'lesson', 'Interrupts')
    );

    expect(response.text).toBe('Lesson generated.');
    expect(fs.createDirectory).toHaveBeenCalledWith(
      `${SUBJECT_ID}/${COURSE_ID}/lesson-01-interrupts`
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${SUBJECT_ID}/${COURSE_ID}/lesson-01-interrupts/content.md`,
      markdown
    );
  });

  it('writes exercise description and project files', async () => {
    const description = '# Blink an LED\n\nWire up the board and complete the TODOs.';
    const files = [
      { path: 'README.md', content: '# Project setup instructions' },
      { path: 'src/main.c', content: 'int main(void) {\n  // TODO: configure GPIO\n}\n' },
    ];

    server.use(
      chatCompletionSequence([
        toolCallResponse('create_exercise_files', { files, description }),
        textResponse('Exercise generated.'),
      ])
    );

    const fs = createMockFs();
    const agent = new ContentGeneratorAgent(
      fs as unknown as FileSystemService,
      SUBJECT_ID,
      COURSE_ID,
      'exercise-02-blink'
    );

    await agent.run(
      'Create an exercise.',
      contextForModule('exercise-02-blink', 'exercise', 'Blink an LED')
    );

    const moduleDir = `${SUBJECT_ID}/${COURSE_ID}/exercise-02-blink`;
    expect(fs.createDirectory).toHaveBeenCalledWith(moduleDir);
    expect(fs.createDirectory).toHaveBeenCalledWith(`${moduleDir}/project`);
    expect(fs.writeFile).toHaveBeenCalledWith(`${moduleDir}/description.md`, description);
    expect(fs.writeFile).toHaveBeenCalledWith(`${moduleDir}/project/README.md`, files[0].content);
    expect(fs.writeFile).toHaveBeenCalledWith(`${moduleDir}/project/src/main.c`, files[1].content);
  });

  it('writes quiz questions as JSON', async () => {
    server.use(
      chatCompletionSequence([
        toolCallResponse('create_quiz_questions', { questions: mockQuizQuestions }),
        textResponse('Quiz generated.'),
      ])
    );

    const fs = createMockFs();
    const agent = new ContentGeneratorAgent(
      fs as unknown as FileSystemService,
      SUBJECT_ID,
      COURSE_ID,
      'quiz-03-checkpoint'
    );

    await agent.run(
      'Create a quiz.',
      contextForModule('quiz-03-checkpoint', 'quiz', 'Checkpoint Quiz')
    );

    expect(fs.writeJSON).toHaveBeenCalledWith(
      `${SUBJECT_ID}/${COURSE_ID}/quiz-03-checkpoint/questions.json`,
      mockQuizQuestions
    );
  });

  it('rejects a quiz with no questions and writes nothing', async () => {
    server.use(
      chatCompletionSequence([
        toolCallResponse('create_quiz_questions', { questions: [] }),
        textResponse('I could not generate the quiz.'),
      ])
    );

    const fs = createMockFs();
    const agent = new ContentGeneratorAgent(
      fs as unknown as FileSystemService,
      SUBJECT_ID,
      COURSE_ID,
      'quiz-03-checkpoint'
    );

    const response = await agent.run(
      'Create a quiz.',
      contextForModule('quiz-03-checkpoint', 'quiz', 'Checkpoint Quiz')
    );

    // The validation error is fed back to the model as a tool result,
    // and no file is written
    expect(response.text).toBe('I could not generate the quiz.');
    expect(fs.writeJSON).not.toHaveBeenCalled();
  });

  it('reports token usage from the final response', async () => {
    server.use(
      chatCompletionSequence([
        toolCallResponse('create_lesson_content', { markdown: '# Short lesson' }),
        textResponse('Done.'),
      ])
    );

    const fs = createMockFs();
    const agent = new ContentGeneratorAgent(
      fs as unknown as FileSystemService,
      SUBJECT_ID,
      COURSE_ID,
      'lesson-01-interrupts'
    );

    const response = await agent.run(
      'Create a lesson.',
      contextForModule('lesson-01-interrupts', 'lesson', 'Interrupts')
    );

    expect(response.usage).toEqual({ inputTokens: 100, outputTokens: 50 });
    expect(response.stopReason).toBe('stop_sequence');
  });
});
