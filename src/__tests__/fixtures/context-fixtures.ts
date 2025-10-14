import type {
  UserContext,
  SubjectContext,
  CourseContext,
  ModuleContext,
  HierarchicalContext,
} from '../../types/context';
import type { Module, Lesson, Exercise, Quiz } from '../../types/module';

// User Context Fixture
export const mockUserContext: UserContext = {
  name: 'Test User',
  preferredIDE: 'vscode',
  learningStylePreference: 'hands-on',
  createdAt: '2025-01-01T00:00:00.000Z',
};

// Subject Context Fixture
export const mockSubjectContext: SubjectContext = {
  subjectName: 'Test Subject',
  subjectId: 'test-subject',
  description: 'A test subject for unit testing',
  tools: 'VSCode, Git',
  background: 'Basic programming knowledge',
  createdAt: '2025-01-01T00:00:00.000Z',
};

// Course Context Fixture
export const mockCourseContext: CourseContext = {
  courseName: 'Test Course',
  courseId: 'test-course',
  goal: 'Learn test-driven development',
  prerequisitesCovered: 'Basic programming concepts',
  targetKnowledgeLevel: 'intermediate',
  createdAt: '2025-01-01T00:00:00.000Z',
};

// Module Context Fixtures
export const mockLessonContext: ModuleContext = {
  moduleId: 'lesson-01-intro',
  type: 'lesson',
  title: 'Introduction to Testing',
  completed: false,
  contentPath: 'test-subject/test-course/lesson-01-intro/content.md',
};

export const mockExerciseContext: ModuleContext = {
  moduleId: 'exercise-01-practice',
  type: 'exercise',
  title: 'Practice Exercise',
  completed: false,
  descriptionPath: 'test-subject/test-course/exercise-01-practice/description.md',
  projectPath: 'test-subject/test-course/exercise-01-practice/project',
};

export const mockQuizContext: ModuleContext = {
  moduleId: 'quiz-01-assessment',
  type: 'quiz',
  title: 'Assessment Quiz',
  completed: false,
  questionsPath: 'test-subject/test-course/quiz-01-assessment/questions.json',
};

// Full Hierarchical Context Fixture
export const mockHierarchicalContext: HierarchicalContext = {
  user: mockUserContext,
  subject: mockSubjectContext,
  course: mockCourseContext,
  module: mockLessonContext,
};

// Module Fixtures
export const mockLesson: Lesson = {
  type: 'lesson',
  id: 'lesson-01-intro',
  title: 'Introduction to Testing',
  completed: false,
  contentPath: 'test-subject/test-course/lesson-01-intro/content.md',
};

export const mockExercise: Exercise = {
  type: 'exercise',
  id: 'exercise-01-practice',
  title: 'Practice Exercise',
  completed: false,
  descriptionPath: 'test-subject/test-course/exercise-01-practice/description.md',
  projectPath: 'test-subject/test-course/exercise-01-practice/project',
};

export const mockQuiz: Quiz = {
  type: 'quiz',
  id: 'quiz-01-assessment',
  title: 'Assessment Quiz',
  completed: false,
  questionsPath: 'test-subject/test-course/quiz-01-assessment/questions.json',
};

export const mockModules: Module[] = [mockLesson, mockExercise, mockQuiz];

// Quiz Question Fixtures
export const mockQuizQuestions = [
  {
    question: 'What is unit testing?',
    type: 'multiple-choice',
    options: ['A type of test', 'A framework', 'A language', 'A tool'],
    correctAnswer: 'A type of test',
    explanation: 'Unit testing is a type of testing focused on individual components.',
  },
  {
    question: 'Explain the benefits of TDD.',
    type: 'short-answer',
    correctAnswer: 'Better code quality, early bug detection, documentation',
    explanation: 'TDD provides multiple benefits including better code quality.',
  },
];
