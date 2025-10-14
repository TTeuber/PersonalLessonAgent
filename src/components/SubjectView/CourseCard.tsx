/**
 * CourseCard Component
 * Displays a single course card with progress information
 */

import { GraduationCap, CheckCircle } from 'lucide-react';
import type { Course } from '../../types/course';

interface CourseCardProps {
  course: Course;
  onClick: () => void;
}

/**
 * Individual course card component
 */
export function CourseCard({ course, onClick }: CourseCardProps) {
  const progressPercent =
    course.moduleCount > 0
      ? Math.round((course.completedCount / course.moduleCount) * 100)
      : 0;

  const isComplete = course.completedCount === course.moduleCount && course.moduleCount > 0;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all cursor-pointer p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        {isComplete && (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Complete</span>
          </div>
        )}
      </div>

      {/* Course name */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
        {course.courseName}
      </h3>

      {/* Goal */}
      {course.goal && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {course.goal}
        </p>
      )}

      {/* Progress bar */}
      {course.moduleCount > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {course.completedCount} / {course.moduleCount} modules
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isComplete ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
        <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
        {course.moduleCount > 0 && (
          <span className="font-medium">{progressPercent}% complete</span>
        )}
      </div>
    </div>
  );
}
