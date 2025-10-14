/**
 * Module type definitions for lessons, exercises, and quizzes
 */

export interface BaseModule {
  id: string;
  type: 'lesson' | 'exercise' | 'quiz';
  title: string;
  description?: string;
  completed: boolean;
  order: number;
}

export interface Lesson extends BaseModule {
  type: 'lesson';
  contentPath: string; // Path to markdown file
}

export interface Exercise extends BaseModule {
  type: 'exercise';
  descriptionPath: string; // Path to description markdown
  projectPath: string; // Path to project folder
}

export interface Quiz extends BaseModule {
  type: 'quiz';
  questionsPath: string; // Path to questions JSON
}

export type Module = Lesson | Exercise | Quiz;

export interface QuizQuestion {
  type: 'multiple-choice' | 'short-answer' | 'code-completion';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string;
  explanation: string;
}
