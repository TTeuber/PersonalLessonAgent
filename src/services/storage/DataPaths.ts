/**
 * Path utility functions for data directory
 * All paths are relative to the data directory root
 */

/**
 * Get the path to the user context file
 */
export function getUserContextPath(): string {
  return 'user-context.json';
}

/**
 * Get the path to a subject's directory
 */
export function getSubjectPath(subjectId: string): string {
  return subjectId;
}

/**
 * Get the path to a subject's context file
 */
export function getSubjectContextPath(subjectId: string): string {
  return `${subjectId}/subject-context.json`;
}

/**
 * Get the path to a course's directory
 */
export function getCoursePath(subjectId: string, courseId: string): string {
  return `${subjectId}/${courseId}`;
}

/**
 * Get the path to a course's context file
 */
export function getCourseContextPath(subjectId: string, courseId: string): string {
  return `${subjectId}/${courseId}/course-context.json`;
}

/**
 * Get the path to a course's modules file (list of all modules)
 */
export function getCourseModulesPath(subjectId: string, courseId: string): string {
  return `${subjectId}/${courseId}/modules.json`;
}

/**
 * Get the path to a module's directory
 */
export function getModulePath(subjectId: string, courseId: string, moduleId: string): string {
  return `${subjectId}/${courseId}/${moduleId}`;
}

/**
 * Get the path to a module's context file
 */
export function getModuleContextPath(subjectId: string, courseId: string, moduleId: string): string {
  return `${subjectId}/${courseId}/${moduleId}/module-context.json`;
}

/**
 * Get the path to a lesson's content file
 */
export function getLessonContentPath(subjectId: string, courseId: string, moduleId: string): string {
  return `${subjectId}/${courseId}/${moduleId}/content.md`;
}

/**
 * Get the path to an exercise's description file
 */
export function getExerciseDescriptionPath(subjectId: string, courseId: string, moduleId: string): string {
  return `${subjectId}/${courseId}/${moduleId}/description.md`;
}

/**
 * Get the path to an exercise's project directory
 */
export function getExerciseProjectPath(subjectId: string, courseId: string, moduleId: string): string {
  return `${subjectId}/${courseId}/${moduleId}/project`;
}

/**
 * Get the path to a quiz's questions file
 */
export function getQuizQuestionsPath(subjectId: string, courseId: string, moduleId: string): string {
  return `${subjectId}/${courseId}/${moduleId}/questions.json`;
}

/**
 * Get the path to a module's chat history file
 */
export function getModuleChatHistoryPath(subjectId: string, courseId: string, moduleId: string): string {
  return `${subjectId}/${courseId}/${moduleId}/chat-history.json`;
}

/**
 * Convert a string to kebab-case for use as an ID
 */
export function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
