import { FileSystemService } from './FileSystemService';
import type {
  UserContext,
  SubjectContext,
  CourseContext,
  ModuleContext,
  HierarchicalContext,
} from '../../types/context';
import type { Module } from '../../types/module';
import type { Course } from '../../types/course';
import {
  getUserContextPath,
  getSubjectContextPath,
  getCourseContextPath,
  getModuleContextPath,
  getCoursePath,
  getCourseModulesPath,
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

  /**
   * Load all courses for a subject (by listing directories in subject folder)
   */
  async loadAllCourses(subjectId: string): Promise<Course[]> {
    try {
      const subjectPath = getCoursePath(subjectId, '').replace(/\/$/, ''); // Remove trailing slash
      const entries = await this.fs.listDirectory(subjectPath);
      const courses: Course[] = [];

      for (const entry of entries) {
        if (entry.isDirectory && !entry.name.startsWith('.')) {
          const contextPath = getCourseContextPath(subjectId, entry.name);
          if (await this.fs.exists(contextPath)) {
            try {
              const courseContext = await this.fs.readJSON<CourseContext>(contextPath);

              // Count modules
              const modulesPath = getCourseModulesPath(subjectId, entry.name);
              let moduleCount = 0;
              let completedCount = 0;

              if (await this.fs.exists(modulesPath)) {
                try {
                  const modules = await this.fs.readJSON<Module[]>(modulesPath);
                  moduleCount = modules.length;
                  completedCount = modules.filter(m => m.completed).length;
                } catch (error) {
                  console.error(`Error loading modules for course ${entry.name}:`, error);
                }
              }

              courses.push({
                courseId: courseContext.courseId,
                courseName: courseContext.courseName,
                subjectId,
                goal: courseContext.goal || '',
                createdAt: courseContext.createdAt || new Date().toISOString(),
                moduleCount,
                completedCount,
              });
            } catch (error) {
              console.error(`Error loading course ${entry.name}:`, error);
            }
          }
        }
      }

      return courses;
    } catch (error) {
      console.error(`Error loading courses for subject ${subjectId}:`, error);
      return [];
    }
  }

  /**
   * Save course context
   */
  async saveCourseContext(
    subjectId: string,
    courseId: string,
    courseContext: CourseContext
  ): Promise<void> {
    // Ensure course directory exists
    const coursePath = getCoursePath(subjectId, courseId);
    await this.fs.createDirectory(coursePath);

    // Save course context
    await this.saveContext('course', courseContext, subjectId, courseId);
  }

  /**
   * Save course modules list
   */
  async saveCourseModules(
    subjectId: string,
    courseId: string,
    modules: Module[]
  ): Promise<void> {
    const modulesPath = getCourseModulesPath(subjectId, courseId);
    await this.fs.writeJSON(modulesPath, modules);
  }

  /**
   * Load course modules
   */
  async loadCourseModules(
    subjectId: string,
    courseId: string
  ): Promise<Module[]> {
    const modulesPath = getCourseModulesPath(subjectId, courseId);
    if (await this.fs.exists(modulesPath)) {
      try {
        return await this.fs.readJSON<Module[]>(modulesPath);
      } catch (error) {
        console.error('Error loading course modules:', error);
        return [];
      }
    }
    return [];
  }
}
