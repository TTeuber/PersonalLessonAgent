/**
 * Context type definitions for the hierarchical learning system
 */

export interface UserContext {
  name?: string;
  preferredIDE: string; // 'idea' | 'pycharm' | 'webstorm' | 'code' | etc.
  learningStylePreference: 'hands-on' | 'theory-first' | 'balanced';
  createdAt: string;
}

export interface SubjectContext {
  subjectName: string;
  subjectId: string; // kebab-case version of name
  createdAt: string;
  // Flexible - AI determines relevant fields
  [key: string]: any;
}

export interface CourseContext {
  courseName: string;
  courseId: string;
  goal: string;
  prerequisitesCovered: string[];
  // Flexible - AI determines relevant fields
  [key: string]: any;
}

export interface ModuleContext {
  moduleId: string;
  type: 'lesson' | 'exercise' | 'quiz';
  title: string;
  completed: boolean;
  // Flexible - AI determines relevant fields
  [key: string]: any;
}

export interface HierarchicalContext {
  user: UserContext;
  subject: SubjectContext;
  course: CourseContext;
  module: ModuleContext;
}
