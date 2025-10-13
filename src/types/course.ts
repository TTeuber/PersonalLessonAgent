/**
 * Course-related type definitions
 */

import type { Module } from './module';

/**
 * Course metadata
 */
export interface Course {
  courseId: string;
  courseName: string;
  subjectId: string;
  goal: string;
  createdAt: string;
  moduleCount: number;
  completedCount: number;
}

/**
 * Course with full module list
 */
export interface CourseWithModules extends Course {
  modules: Module[];
}

/**
 * Course creation data
 */
export interface CourseCreationData {
  courseName: string;
  courseContext: Record<string, unknown>;
  modules: Array<{
    type: 'lesson' | 'exercise' | 'quiz';
    title: string;
    description: string;
    order: number;
  }>;
}
