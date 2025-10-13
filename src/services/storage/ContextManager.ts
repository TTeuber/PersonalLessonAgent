import { FileSystemService } from './FileSystemService';
import type {
  UserContext,
  SubjectContext,
  CourseContext,
  ModuleContext,
  HierarchicalContext,
} from '../../types/context';
import {
  getUserContextPath,
  getSubjectContextPath,
  getCourseContextPath,
  getModuleContextPath,
} from './DataPaths';

/**
 * ContextManager handles loading and saving context files
 * in the hierarchical learning system
 */
export class ContextManager {
  private fs: FileSystemService;

  constructor(fs: FileSystemService) {
    this.fs = fs;
  }

  /**
   * Load the hierarchical context based on the current location
   * @param subjectId - Optional subject ID
   * @param courseId - Optional course ID
   * @param moduleId - Optional module ID
   * @returns Partial context with available data
   */
  async loadHierarchicalContext(
    subjectId: string | undefined = undefined,
    courseId: string | undefined = undefined,
    moduleId: string | undefined = undefined
  ): Promise<Partial<HierarchicalContext>> {
    const context: Partial<HierarchicalContext> = {};

    // Load user context
    const userPath = getUserContextPath();
    if (await this.fs.exists(userPath)) {
      try {
        context.user = await this.fs.readJSON<UserContext>(userPath);
      } catch (error) {
        console.error('Error loading user context:', error);
      }
    }

    // Load subject context if specified
    if (subjectId) {
      const subjectPath = getSubjectContextPath(subjectId);
      if (await this.fs.exists(subjectPath)) {
        try {
          context.subject = await this.fs.readJSON<SubjectContext>(subjectPath);
        } catch (error) {
          console.error('Error loading subject context:', error);
        }
      }
    }

    // Load course context if specified
    if (subjectId && courseId) {
      const coursePath = getCourseContextPath(subjectId, courseId);
      if (await this.fs.exists(coursePath)) {
        try {
          context.course = await this.fs.readJSON<CourseContext>(coursePath);
        } catch (error) {
          console.error('Error loading course context:', error);
        }
      }
    }

    // Load module context if specified
    if (subjectId && courseId && moduleId) {
      const modulePath = getModuleContextPath(subjectId, courseId, moduleId);
      if (await this.fs.exists(modulePath)) {
        try {
          context.module = await this.fs.readJSON<ModuleContext>(modulePath);
        } catch (error) {
          console.error('Error loading module context:', error);
        }
      }
    }

    return context;
  }

  /**
   * Save a context at a specific level
   */
  async saveContext(
    level: 'user' | 'subject' | 'course' | 'module',
    data: any,
    subjectId?: string,
    courseId?: string,
    moduleId?: string
  ): Promise<void> {
    let path: string;

    switch (level) {
      case 'user':
        path = getUserContextPath();
        break;
      case 'subject':
        if (!subjectId) throw new Error('subjectId required for subject context');
        path = getSubjectContextPath(subjectId);
        break;
      case 'course':
        if (!subjectId || !courseId) throw new Error('subjectId and courseId required for course context');
        path = getCourseContextPath(subjectId, courseId);
        break;
      case 'module':
        if (!subjectId || !courseId || !moduleId) {
          throw new Error('subjectId, courseId, and moduleId required for module context');
        }
        path = getModuleContextPath(subjectId, courseId, moduleId);
        break;
    }

    await this.fs.writeJSON(path, data);
  }

  /**
   * Load user context (or return null if not found)
   */
  async loadUserContext(): Promise<UserContext | null> {
    const userPath = getUserContextPath();
    if (await this.fs.exists(userPath)) {
      try {
        return await this.fs.readJSON<UserContext>(userPath);
      } catch (error) {
        console.error('Error loading user context:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Save user context
   */
  async saveUserContext(user: UserContext): Promise<void> {
    await this.saveContext('user', user);
  }

  /**
   * Load all subjects (by listing directories in data root)
   */
  async loadAllSubjects(): Promise<SubjectContext[]> {
    try {
      const entries = await this.fs.listDirectory('');
      const subjects: SubjectContext[] = [];

      for (const entry of entries) {
        if (entry.isDirectory && !entry.name.startsWith('.')) {
          const contextPath = getSubjectContextPath(entry.name);
          if (await this.fs.exists(contextPath)) {
            try {
              const subject = await this.fs.readJSON<SubjectContext>(contextPath);
              subjects.push(subject);
            } catch (error) {
              console.error(`Error loading subject ${entry.name}:`, error);
            }
          }
        }
      }

      return subjects;
    } catch (error) {
      console.error('Error loading subjects:', error);
      return [];
    }
  }
}
