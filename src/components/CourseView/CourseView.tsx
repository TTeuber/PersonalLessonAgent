/**
 * CourseView Component
 * Displays course details and module list with content generation
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Header } from '../Shared/Header';
import { ModuleListItem } from './ModuleListItem';
import { ContentGenerationFlow } from './ContentGenerationFlow';
import { ContextManager } from '../../services/storage/ContextManager';
import { FileSystemService } from '../../services/storage/FileSystemService';
import type { Module } from '../../types/module';
import type { CourseContext } from '../../types/context';
import {
  generateModuleContent,
  generateAllCourseContent,
  hasGeneratedContent,
  type GenerationProgressCallback,
} from '../../services/tools/ContentTools';

interface GenerationStep {
  moduleId: string;
  moduleName: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
}

export function CourseView() {
  const { subjectId, courseId } = useParams<{ subjectId: string; courseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseContext | null>(null);
  const [modules, setModules] = useState<Module[]>([]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingModuleId, setGeneratingModuleId] = useState<string | null>(null);
  const [showGenerationFlow, setShowGenerationFlow] = useState(false);
  const [currentModule, setCurrentModule] = useState(0);
  const [totalModules, setTotalModules] = useState(0);
  const [currentModuleName, setCurrentModuleName] = useState('');
  const [generationStatus, setGenerationStatus] = useState<'generating' | 'complete' | 'error'>('generating');
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);

  const fs = new FileSystemService();
  const contextManager = new ContextManager(fs);

  useEffect(() => {
    loadCourseData();
  }, [subjectId, courseId]);

  const loadCourseData = async () => {
    if (!subjectId || !courseId) {
      setError('Missing subject or course ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load course context
      const context = await contextManager.loadHierarchicalContext(subjectId, courseId);
      if (!context.course) {
        setError('Course not found');
        setLoading(false);
        return;
      }

      setCourse(context.course);

      // Load modules
      const loadedModules = await contextManager.loadCourseModules(subjectId, courseId);
      setModules(loadedModules);

      setLoading(false);
    } catch (err) {
      console.error('Error loading course data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course');
      setLoading(false);
    }
  };

  const handleGenerateSingleModule = async (moduleId: string) => {
    if (!subjectId || !courseId || isGenerating) return;

    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    try {
      setIsGenerating(true);
      setGeneratingModuleId(moduleId);

      const result = await generateModuleContent(
        subjectId,
        courseId,
        module,
        contextManager,
        fs
      );

      if (result.success) {
        // Reload modules to get updated paths
        await loadCourseData();
      } else {
        setError(result.error || 'Failed to generate content');
      }
    } catch (err) {
      console.error('Error generating module content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
      setGeneratingModuleId(null);
    }
  };

  const handleGenerateAllContent = async () => {
    if (!subjectId || !courseId || isGenerating) return;

    // Initialize generation steps
    const steps: GenerationStep[] = modules.map(m => ({
      moduleId: m.id,
      moduleName: m.title,
      status: 'pending',
    }));

    setGenerationSteps(steps);
    setIsGenerating(true);
    setShowGenerationFlow(true);
    setTotalModules(modules.length);
    setCurrentModule(0);
    setGenerationStatus('generating');

    const onProgress: GenerationProgressCallback = (current, total, moduleName, status) => {
      setCurrentModule(current);
      setTotalModules(total);
      setCurrentModuleName(moduleName);

      // Update step status
      setGenerationSteps(prev => {
        const updated = [...prev];
        const stepIndex = current - 1;
        if (stepIndex >= 0 && stepIndex < updated.length) {
          updated[stepIndex] = {
            ...updated[stepIndex],
            status: status === 'generating' ? 'generating' : status === 'complete' ? 'complete' : 'error',
          };
        }
        return updated;
      });
    };

    try {
      const result = await generateAllCourseContent(
        subjectId,
        courseId,
        contextManager,
        fs,
        onProgress
      );

      if (result.success) {
        setGenerationStatus('complete');
        // Reload modules to get updated paths
        await loadCourseData();
      } else {
        setGenerationStatus('error');
        // Update failed steps
        setGenerationSteps(prev => {
          const updated = [...prev];
          result.results.forEach((r, index) => {
            if (!r.success) {
              updated[index] = {
                ...updated[index],
                status: 'error',
                error: r.error,
              };
            }
          });
          return updated;
        });
      }
    } catch (err) {
      console.error('Error generating all content:', err);
      setGenerationStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloseGenerationFlow = () => {
    setShowGenerationFlow(false);
    setGenerationSteps([]);
    setCurrentModule(0);
    setTotalModules(0);
    setCurrentModuleName('');
  };

  const handleModuleClick = (moduleId: string) => {
    // Navigate to module view (Phase 4)
    navigate(`/subject/${subjectId}/course/${courseId}/module/${moduleId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Course" onBack={() => navigate(`/subject/${subjectId}`)} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Course" onBack={() => navigate(`/subject/${subjectId}`)} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Course</h2>
            <p className="text-gray-600 dark:text-gray-400">{error || 'Course not found'}</p>
            <button
              onClick={() => navigate(`/subject/${subjectId}`)}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Subject
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allContentGenerated = modules.length > 0 && modules.every(m => hasGeneratedContent(m));
  const someContentGenerated = modules.some(m => hasGeneratedContent(m));
  const completedCount = modules.filter(m => m.completed).length;
  const progressPercentage = modules.length > 0 ? (completedCount / modules.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title={course.courseName} onBack={() => navigate(`/subject/${subjectId}`)} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Course header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/30 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {course.courseName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{course.goal}</p>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{completedCount} / {modules.length} modules completed</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate all button */}
        {!allContentGenerated && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                  {someContentGenerated ? 'Continue Generating Content' : 'Generate Course Content'}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {someContentGenerated
                    ? 'Some modules are missing content. Generate the remaining content with AI.'
                    : 'Use AI to generate lessons, exercises, and quizzes for all modules.'}
                </p>
              </div>
              <button
                onClick={handleGenerateAllContent}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-4"
              >
                <Sparkles className="w-4 h-4" />
                Generate All
              </button>
            </div>
          </div>
        )}

        {/* Module list */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Course Modules
          </h2>

          {modules.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No modules found for this course.</p>
            </div>
          ) : (
            modules.map((module, index) => (
              <ModuleListItem
                key={module.id}
                module={module}
                moduleNumber={index + 1}
                onGenerateContent={handleGenerateSingleModule}
                isGenerating={isGenerating && generatingModuleId === module.id}
                onClick={() => handleModuleClick(module.id)}
              />
            ))
          )}
        </div>
      </main>

      {/* Content generation flow modal */}
      <ContentGenerationFlow
        isOpen={showGenerationFlow}
        modules={modules.map(m => ({ id: m.id, title: m.title }))}
        currentModule={currentModule}
        totalModules={totalModules}
        currentModuleName={currentModuleName}
        status={generationStatus}
        onClose={handleCloseGenerationFlow}
        steps={generationSteps}
      />
    </div>
  );
}
