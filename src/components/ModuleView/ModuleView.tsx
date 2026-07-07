import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ContextManager } from '../../services/storage/ContextManager';
import { FileSystemService } from '../../services/storage/FileSystemService';
import type { HierarchicalContext } from '../../types/context';
import type { Module } from '../../types/module';
import { ModuleBrowserView } from './ModuleBrowserView';

export function ModuleView() {
  const { subjectId, courseId, moduleId } = useParams<{
    subjectId: string;
    courseId: string;
    moduleId: string;
  }>();
  const navigate = useNavigate();

  const [module, setModule] = useState<Module | null>(null);
  const [context, setContext] = useState<HierarchicalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModuleData = useCallback(async () => {
    if (!subjectId || !courseId || !moduleId) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fs = new FileSystemService();
      const contextManager = new ContextManager(fs);

      // Load the module
      const loadedModule = await contextManager.getModule(
        subjectId,
        courseId,
        moduleId
      );

      if (!loadedModule) {
        setError('Module not found');
        setLoading(false);
        return;
      }

      // Load hierarchical context
      const loadedContext = await contextManager.loadHierarchicalContext(
        subjectId,
        courseId,
        moduleId
      );

      // Validate that we have all required context
      if (!loadedContext.user || !loadedContext.subject || !loadedContext.course || !loadedContext.module) {
        setError('Incomplete context data');
        setLoading(false);
        return;
      }

      setModule(loadedModule);
      setContext(loadedContext as HierarchicalContext);
    } catch (err) {
      console.error('Error loading module data:', err);
      setError('Failed to load module');
    } finally {
      setLoading(false);
    }
  }, [subjectId, courseId, moduleId]);

  useEffect(() => {
    loadModuleData();
  }, [loadModuleData]);

  const handleComplete = async () => {
    if (!subjectId || !courseId || !moduleId || !module) return;

    try {
      const fs = new FileSystemService();
      const contextManager = new ContextManager(fs);

      // Mark module as complete
      await contextManager.updateModuleMetadata(
        subjectId,
        courseId,
        moduleId,
        { completed: true }
      );

      // Update local state
      setModule({ ...module, completed: true });
    } catch (err) {
      console.error('Error marking module complete:', err);
      alert('Failed to mark module as complete. Please try again.');
    }
  };

  const handleBackToCourse = () => {
    navigate(`/subject/${subjectId}/course/${courseId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading module...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !module || !context) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error || 'Failed to load module'}</p>
          <button
            onClick={handleBackToCourse}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  // Route to module browser view for all module types
  return (
    <ModuleBrowserView
      module={module}
      context={context}
      onComplete={handleComplete}
      onBack={handleBackToCourse}
    />
  );
}
