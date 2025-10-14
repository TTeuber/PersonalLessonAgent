/**
 * ContentGenerationFlow Component
 * Shows progress while generating module content
 */

import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, XCircle, Sparkles } from 'lucide-react';

interface GenerationStep {
  moduleId: string;
  moduleName: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
}

interface ContentGenerationFlowProps {
  isOpen: boolean;
  modules: Array<{ id: string; title: string }>;
  currentModule: number;
  totalModules: number;
  currentModuleName: string;
  status: 'generating' | 'complete' | 'error';
  onClose: () => void;
  steps: GenerationStep[];
}

export function ContentGenerationFlow({
  isOpen,
  currentModule,
  totalModules,
  status,
  onClose,
  steps,
}: ContentGenerationFlowProps) {
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const isComplete = status === 'complete';
  const hasErrors = status === 'error';
  const isGenerating = status === 'generating';

  const handleClose = () => {
    if (isComplete || hasErrors) {
      setIsVisible(false);
      setTimeout(() => onClose(), 300);
    }
  };

  const getStepIcon = (stepStatus: GenerationStep['status']) => {
    switch (stepStatus) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />;
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Generating Course Content
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isComplete
                  ? 'All modules generated successfully!'
                  : hasErrors
                  ? 'Some modules failed to generate'
                  : `Generating module ${currentModule} of ${totalModules}...`}
              </p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {isGenerating && (
          <div className="px-6 pt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentModule / totalModules) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {Math.round((currentModule / totalModules) * 100)}% complete
            </p>
          </div>
        )}

        {/* Module list */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.moduleId}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border
                  ${step.status === 'complete' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
                  ${step.status === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : ''}
                  ${step.status === 'generating' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
                  ${step.status === 'pending' ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' : ''}
                `}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {index + 1}. {step.moduleName}
                  </p>
                  {step.status === 'generating' && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Generating content...
                    </p>
                  )}
                  {step.status === 'complete' && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Content generated successfully
                    </p>
                  )}
                  {step.status === 'error' && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {step.error || 'Failed to generate content'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          {isComplete && (
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Done
            </button>
          )}
          {hasErrors && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Some modules failed to generate. You can retry them individually from the course view.
              </p>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          )}
          {isGenerating && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Please wait while content is being generated...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
