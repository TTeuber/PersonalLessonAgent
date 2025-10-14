/**
 * CoursePlanReview Component
 * Displays generated course outline for review and approval
 */

import { Book, Code, ClipboardList, CheckCircle } from 'lucide-react';
import { Button } from '../Shared/Button';
import type { ModuleOutline } from '../../types/agent';

interface CoursePlanReviewProps {
  courseName: string;
  modules: ModuleOutline[];
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
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
  onReject,
  isProcessing = false,
}: CoursePlanReviewProps) {
  // Calculate module type counts
  const counts = modules.reduce(
    (acc, module) => {
      acc[module.type]++;
      return acc;
    },
    { lesson: 0, exercise: 0, quiz: 0 }
  );

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
            Total: {modules.length} modules
          </div>
        </div>
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
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
      </div>

      {/* Actions */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onReject}
            disabled={isProcessing}
          >
            Start Over
          </Button>
          <Button
            onClick={onApprove}
            disabled={isProcessing}
          >
            {isProcessing ? 'Creating Course...' : 'Approve & Create Course'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          Once approved, the course structure will be saved and you can start learning!
        </p>
      </div>
    </div>
  );
}
