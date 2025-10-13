/**
 * Content Tools
 * Utilities for content generation workflows
 */

import { ContentGeneratorAgent } from '../agents/ContentGeneratorAgent';
import { ContextManager } from '../storage/ContextManager';
import { FileSystemService } from '../storage/FileSystemService';
import type { Module, Lesson, Exercise, Quiz } from '../../types/module';
import type { HierarchicalContext, ModuleContext } from '../../types/context';

/**
 * Progress callback for content generation
 */
export type GenerationProgressCallback = (
  currentModule: number,
  totalModules: number,
  moduleName: string,
  status: 'generating' | 'complete' | 'error'
) => void;

/**
 * Result of generating content for a single module
 */
export interface ModuleGenerationResult {
  moduleId: string;
  success: boolean;
  error?: string;
}

/**
 * Result of generating content for all modules
 */
export interface CourseGenerationResult {
  success: boolean;
  results: ModuleGenerationResult[];
  totalGenerated: number;
  totalFailed: number;
}

/**
 * Generate content for a single module
 */
export async function generateModuleContent(
  subjectId: string,
  courseId: string,
  module: Module,
  contextManager: ContextManager,
  fs: FileSystemService,
  onProgress?: (status: 'generating' | 'complete' | 'error') => void
): Promise<ModuleGenerationResult> {
  try {
    onProgress?.('generating');

    // Load full hierarchical context
    const context = await contextManager.loadHierarchicalContext(subjectId, courseId);

    // Add module-specific context
    const moduleContext: ModuleContext = {
      moduleId: module.id,
      type: module.type,
      title: module.title,
      completed: module.completed,
      description: (module as any).description || '',
      order: module.order,
    };

    const fullContext: Partial<HierarchicalContext> = {
      ...context,
      module: moduleContext,
    };

    // Create content generator agent
    const agent = new ContentGeneratorAgent(fs, subjectId, courseId, module.id);

    // Generate content based on module type
    const prompt = createGenerationPrompt(module);
    await agent.run(prompt, fullContext);

    // Update module metadata with content paths
    const updates = await getModuleUpdates(module);
    await contextManager.updateModuleMetadata(subjectId, courseId, module.id, updates);

    // Save module context
    await contextManager.saveModuleContext(subjectId, courseId, module.id, moduleContext);

    onProgress?.('complete');

    return {
      moduleId: module.id,
      success: true,
    };
  } catch (error) {
    console.error(`Error generating content for module ${module.id}:`, error);
    onProgress?.('error');

    return {
      moduleId: module.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate content for all modules in a course
 */
export async function generateAllCourseContent(
  subjectId: string,
  courseId: string,
  contextManager: ContextManager,
  fs: FileSystemService,
  onProgress?: GenerationProgressCallback
): Promise<CourseGenerationResult> {
  const modules = await contextManager.loadCourseModules(subjectId, courseId);
  const results: ModuleGenerationResult[] = [];

  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    onProgress?.(i + 1, modules.length, module.title, 'generating');

    const result = await generateModuleContent(
      subjectId,
      courseId,
      module,
      contextManager,
      fs,
      (status) => {
        if (status === 'complete' || status === 'error') {
          onProgress?.(i + 1, modules.length, module.title, status);
        }
      }
    );

    results.push(result);
  }

  const totalGenerated = results.filter(r => r.success).length;
  const totalFailed = results.filter(r => !r.success).length;

  return {
    success: totalFailed === 0,
    results,
    totalGenerated,
    totalFailed,
  };
}

/**
 * Create generation prompt based on module type
 */
function createGenerationPrompt(module: Module): string {
  const moduleInfo = (module as any).description
    ? `\n\nModule Description: ${(module as any).description}`
    : '';

  switch (module.type) {
    case 'lesson':
      return `Create a comprehensive lesson for: "${module.title}"${moduleInfo}

Please generate engaging, educational content that teaches this topic clearly and effectively. Include examples, explanations, and visualizations where appropriate.`;

    case 'exercise':
      return `Create a hands-on exercise for: "${module.title}"${moduleInfo}

Please generate a practical coding exercise with starter files, clear instructions, and TODO comments to guide the learner.`;

    case 'quiz':
      return `Create a quiz to assess understanding of: "${module.title}"${moduleInfo}

Please generate 5-8 questions that test the learner's comprehension of the key concepts covered in previous lessons.`;

    default:
      return `Create content for module${moduleInfo}`;
  }
}

/**
 * Get module updates based on module type
 */
async function getModuleUpdates(module: Module): Promise<Partial<Module>> {
  switch (module.type) {
    case 'lesson': {
      const lessonUpdates: Partial<Lesson> = {
        contentPath: `${module.id}/content.md`,
      };
      return lessonUpdates;
    }

    case 'exercise': {
      const exerciseUpdates: Partial<Exercise> = {
        descriptionPath: `${module.id}/description.md`,
        projectPath: `${module.id}/project`,
      };
      return exerciseUpdates;
    }

    case 'quiz': {
      const quizUpdates: Partial<Quiz> = {
        questionsPath: `${module.id}/questions.json`,
      };
      return quizUpdates;
    }

    default:
      return {};
  }
}

/**
 * Check if a module has generated content
 */
export function hasGeneratedContent(module: Module): boolean {
  switch (module.type) {
    case 'lesson':
      return !!(module as Lesson).contentPath;

    case 'exercise':
      return !!(module as Exercise).descriptionPath && !!(module as Exercise).projectPath;

    case 'quiz':
      return !!(module as Quiz).questionsPath;

    default:
      return false;
  }
}

/**
 * Get content generation status for a module
 */
export function getModuleContentStatus(module: Module): 'not-generated' | 'generated' | 'completed' {
  if (module.completed) {
    return 'completed';
  }
  if (hasGeneratedContent(module)) {
    return 'generated';
  }
  return 'not-generated';
}
