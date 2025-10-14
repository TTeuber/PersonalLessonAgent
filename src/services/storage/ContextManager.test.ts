import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextManager } from './ContextManager';
import { FileSystemService } from './FileSystemService';
import {
  mockUserContext,
  mockSubjectContext,
  mockCourseContext,
  mockLessonContext,
  mockLesson,
  mockExercise,
  mockQuiz,
  mockModules,
} from '../../__tests__/fixtures/context-fixtures';
import { createMockFileSystemService } from '../../__tests__/utils/test-utils';

describe('ContextManager', () => {
  let contextManager: ContextManager;
  let mockFS: ReturnType<typeof createMockFileSystemService>;

  beforeEach(() => {
    mockFS = createMockFileSystemService();
    contextManager = new ContextManager(mockFS as unknown as FileSystemService);
  });

  describe('loadHierarchicalContext()', () => {
    it('should load user context only when no IDs provided', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON.mockResolvedValue(mockUserContext);

      const context = await contextManager.loadHierarchicalContext();

      expect(context.user).toEqual(mockUserContext);
      expect(context.subject).toBeUndefined();
      expect(context.course).toBeUndefined();
      expect(context.module).toBeUndefined();
    });

    it('should load user and subject context when subjectId provided', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON
        .mockResolvedValueOnce(mockUserContext)
        .mockResolvedValueOnce(mockSubjectContext);

      const context = await contextManager.loadHierarchicalContext('test-subject');

      expect(context.user).toEqual(mockUserContext);
      expect(context.subject).toEqual(mockSubjectContext);
      expect(context.course).toBeUndefined();
      expect(context.module).toBeUndefined();
    });

    it('should load full hierarchy when all IDs provided', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON
        .mockResolvedValueOnce(mockUserContext)
        .mockResolvedValueOnce(mockSubjectContext)
        .mockResolvedValueOnce(mockCourseContext)
        .mockResolvedValueOnce(mockLessonContext);

      const context = await contextManager.loadHierarchicalContext(
        'test-subject',
        'test-course',
        'lesson-01-intro'
      );

      expect(context.user).toEqual(mockUserContext);
      expect(context.subject).toEqual(mockSubjectContext);
      expect(context.course).toEqual(mockCourseContext);
      expect(context.module).toEqual(mockLessonContext);
    });

    it('should handle missing files gracefully', async () => {
      mockFS.exists.mockResolvedValue(false);

      const context = await contextManager.loadHierarchicalContext(
        'test-subject',
        'test-course',
        'module-01'
      );

      expect(context.user).toBeUndefined();
      expect(context.subject).toBeUndefined();
      expect(context.course).toBeUndefined();
      expect(context.module).toBeUndefined();
    });

    it('should handle read errors gracefully', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON.mockRejectedValue(new Error('Read error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const context = await contextManager.loadHierarchicalContext('test-subject');

      expect(context.user).toBeUndefined();
      expect(context.subject).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('saveContext()', () => {
    it('should save user context', async () => {
      await contextManager.saveContext('user', mockUserContext);

      expect(mockFS.writeJSON).toHaveBeenCalledWith(
        expect.stringContaining('user-context.json'),
        mockUserContext
      );
    });

    it('should save subject context with subjectId', async () => {
      await contextManager.saveContext('subject', mockSubjectContext, 'test-subject');

      expect(mockFS.writeJSON).toHaveBeenCalledWith(
        expect.stringContaining('test-subject'),
        mockSubjectContext
      );
    });

    it('should throw error when subject context saved without subjectId', async () => {
      await expect(
        contextManager.saveContext('subject', mockSubjectContext)
      ).rejects.toThrow('subjectId required for subject context');
    });

    it('should save course context with subjectId and courseId', async () => {
      await contextManager.saveContext(
        'course',
        mockCourseContext,
        'test-subject',
        'test-course'
      );

      expect(mockFS.writeJSON).toHaveBeenCalledWith(
        expect.stringContaining('test-subject'),
        mockCourseContext
      );
    });

    it('should throw error when course context saved without required IDs', async () => {
      await expect(
        contextManager.saveContext('course', mockCourseContext, 'test-subject')
      ).rejects.toThrow('subjectId and courseId required for course context');
    });

    it('should save module context with all IDs', async () => {
      await contextManager.saveContext(
        'module',
        mockLessonContext,
        'test-subject',
        'test-course',
        'lesson-01'
      );

      expect(mockFS.writeJSON).toHaveBeenCalledWith(
        expect.stringContaining('lesson-01'),
        mockLessonContext
      );
    });

    it('should throw error when module context saved without required IDs', async () => {
      await expect(
        contextManager.saveContext(
          'module',
          mockLessonContext,
          'test-subject',
          'test-course'
        )
      ).rejects.toThrow('subjectId, courseId, and moduleId required for module context');
    });
  });

  describe('loadUserContext()', () => {
    it('should load user context when file exists', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON.mockResolvedValue(mockUserContext);

      const result = await contextManager.loadUserContext();

      expect(result).toEqual(mockUserContext);
    });

    it('should return null when file does not exist', async () => {
      mockFS.exists.mockResolvedValue(false);

      const result = await contextManager.loadUserContext();

      expect(result).toBeNull();
    });

    it('should return null on read error', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON.mockRejectedValue(new Error('Read error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await contextManager.loadUserContext();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('loadAllSubjects()', () => {
    it('should load all subjects from directories', async () => {
      mockFS.listDirectory.mockResolvedValue([
        { name: 'test-subject-1', isDirectory: true },
        { name: 'test-subject-2', isDirectory: true },
        { name: '.hidden', isDirectory: true }, // Should be ignored
        { name: 'file.txt', isDirectory: false }, // Should be ignored
      ]);

      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON
        .mockResolvedValueOnce({ ...mockSubjectContext, subjectId: 'test-subject-1' })
        .mockResolvedValueOnce({ ...mockSubjectContext, subjectId: 'test-subject-2' });

      const subjects = await contextManager.loadAllSubjects();

      expect(subjects).toHaveLength(2);
      expect(subjects[0].subjectId).toBe('test-subject-1');
      expect(subjects[1].subjectId).toBe('test-subject-2');
    });

    it('should return empty array when no subjects found', async () => {
      mockFS.listDirectory.mockResolvedValue([]);

      const subjects = await contextManager.loadAllSubjects();

      expect(subjects).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockFS.listDirectory.mockRejectedValue(new Error('Directory read error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const subjects = await contextManager.loadAllSubjects();

      expect(subjects).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('loadCourseModules()', () => {
    it('should load modules when file exists', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON.mockResolvedValue(mockModules);

      const modules = await contextManager.loadCourseModules('test-subject', 'test-course');

      expect(modules).toEqual(mockModules);
    });

    it('should return empty array when file does not exist', async () => {
      mockFS.exists.mockResolvedValue(false);

      const modules = await contextManager.loadCourseModules('test-subject', 'test-course');

      expect(modules).toEqual([]);
    });

    it('should return empty array on read error', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON.mockRejectedValue(new Error('Read error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const modules = await contextManager.loadCourseModules('test-subject', 'test-course');

      expect(modules).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('saveCourseModules()', () => {
    it('should save modules to file', async () => {
      await contextManager.saveCourseModules('test-subject', 'test-course', mockModules);

      expect(mockFS.writeJSON).toHaveBeenCalledWith(
        expect.stringContaining('modules.json'),
        mockModules
      );
    });
  });

  describe('updateModuleMetadata()', () => {
    it('should update specific module metadata', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON.mockResolvedValue([...mockModules]);

      await contextManager.updateModuleMetadata(
        'test-subject',
        'test-course',
        'lesson-01-intro',
        { completed: true }
      );

      expect(mockFS.writeJSON).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({
            id: 'lesson-01-intro',
            completed: true,
          }),
        ])
      );
    });

    it('should throw error when module not found', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON.mockResolvedValue(mockModules);

      await expect(
        contextManager.updateModuleMetadata(
          'test-subject',
          'test-course',
          'non-existent-module',
          { completed: true }
        )
      ).rejects.toThrow('Module non-existent-module not found');
    });
  });

  describe('getModule()', () => {
    it('should return specific module by ID', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON.mockResolvedValue(mockModules);

      const module = await contextManager.getModule(
        'test-subject',
        'test-course',
        'lesson-01-intro'
      );

      expect(module).toEqual(mockLesson);
    });

    it('should return null when module not found', async () => {
      mockFS.exists.mockResolvedValue(true);
      mockFS.readJSON.mockResolvedValue(mockModules);

      const module = await contextManager.getModule(
        'test-subject',
        'test-course',
        'non-existent'
      );

      expect(module).toBeNull();
    });
  });

  describe('saveCourseContext()', () => {
    it('should create directory and save course context', async () => {
      await contextManager.saveCourseContext(
        'test-subject',
        'test-course',
        mockCourseContext
      );

      expect(mockFS.createDirectory).toHaveBeenCalledWith(
        expect.stringContaining('test-course')
      );
      expect(mockFS.writeJSON).toHaveBeenCalledWith(
        expect.stringContaining('course-context.json'),
        mockCourseContext
      );
    });
  });
});
