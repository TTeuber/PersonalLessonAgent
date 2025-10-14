/**
 * CoursePlanReview Component
 * Displays generated course outline for review and approval
 */

import { useState } from 'react';
import { Book, Code, ClipboardList, CheckCircle, Edit3, Loader2 } from 'lucide-react';
import { Button } from '../Shared/Button';
import type { ModuleOutline } from '../../types/agent';

interface CoursePlanReviewProps {
  courseName: string;
  modules?: ModuleOutline[];
  onApprove: () => void;
  onModify: (modificationRequest: string) => void;
  onStartOver: () => void;
  isProcessing?: boolean;
  isGenerating?: boolean;
  isModifying?: boolean;
}

/**
 * Module type icon mapping
 */
const MODULE_ICONS = {
  lesson: Book,
  exercise: Code,
  quiz: ClipboardList,
};

/**
 * Module type color mapping
 */
const MODULE_COLORS = {
  lesson: 'bg-blue-100 text-blue-600',
  exercise: 'bg-green-100 text-green-600',
  quiz: 'bg-purple-100 text-purple-600',
};

/**
 * Module type label mapping
 */
const MODULE_LABELS = {
  lesson: 'Lesson',
  exercise: 'Exercise',
  quiz: 'Quiz',
};

/**
 * Course plan review component
 */
export function CoursePlanReview({
  courseName,
  modules,
  onApprove,
  onModify,
  onStartOver,
  isProcessing = false,
  isGenerating = false,
  isModifying = false,
}: CoursePlanReviewProps) {
  const [showModifyUI, setShowModifyUI] = useState(false);
  const [modificationRequest, setModificationRequest] = useState('');

  // Calculate module type counts
  const counts = modules?.reduce(
    (acc, module) => {
      acc[module.type]++;
      return acc;
    },
    { lesson: 0, exercise: 0, quiz: 0 }
  ) || { lesson: 0, exercise: 0, quiz: 0 };

  const handleSubmitModification = () => {
    if (modificationRequest.trim()) {
      onModify(modificationRequest);
      setModificationRequest('');
      setShowModifyUI(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{courseName}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review the generated course structure below
            </p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>

        {/* Module summary */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-gray-600 dark:text-gray-400">{counts.lesson} Lessons</span>
          </div>
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-gray-600 dark:text-gray-400">{counts.exercise} Exercises</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-gray-600 dark:text-gray-400">{counts.quiz} Quizzes</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">
            Total: {modules?.length || 0} modules
          </div>
        </div>
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isGenerating ? (
          // Loading state
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Designing your course...
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              The AI is analyzing your interview responses and creating a personalized course structure.
            </p>
          </div>
        ) : modules && modules.length > 0 ? (
          // Module list
          <div className="space-y-3">
            {modules.map((module, index) => {
              const Icon = MODULE_ICONS[module.type];
              const colorClass = MODULE_COLORS[module.type];
              const label = MODULE_LABELS[module.type];

              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Module number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </div>

                    {/* Module icon */}
                    <div className={`flex-shrink-0 p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Module content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {label}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {module.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        {showModifyUI ? (
          // Modification UI
          <div className="space-y-3">
            <div>
              <label htmlFor="modification-request" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What would you like to change?
              </label>
              <textarea
                id="modification-request"
                value={modificationRequest}
                onChange={(e) => setModificationRequest(e.target.value)}
                placeholder="E.g., Add more hands-on exercises, make the course longer, focus more on advanced topics..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                rows={4}
                disabled={isModifying}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModifyUI(false);
                  setModificationRequest('');
                }}
                disabled={isModifying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitModification}
                disabled={!modificationRequest.trim() || isModifying}
              >
                {isModifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Course...
                  </>
                ) : (
                  'Submit Changes'
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Normal action buttons
          <>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowModifyUI(true)}
                disabled={isProcessing || isGenerating || isModifying}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Request Changes
              </Button>
              <Button
                onClick={onApprove}
                disabled={isProcessing || isGenerating || isModifying || !modules || modules.length === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Course...
                  </>
                ) : (
                  'Approve & Create Course'
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={onStartOver}
                disabled={isProcessing || isGenerating || isModifying}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start completely over
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                Once approved, the course structure will be saved and you can start learning!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
