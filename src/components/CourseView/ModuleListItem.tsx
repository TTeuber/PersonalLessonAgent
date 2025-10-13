/**
 * ModuleListItem Component
 * Displays a single module in the course module list
 */

import { Book, Code, ClipboardList, CheckCircle, Circle, Loader2, Sparkles } from 'lucide-react';
import type { Module } from '../../types/module';
import { getModuleContentStatus } from '../../services/tools/ContentTools';

interface ModuleListItemProps {
  module: Module;
  moduleNumber: number;
  onGenerateContent: (moduleId: string) => void;
  isGenerating: boolean;
  onClick?: () => void;
}

export function ModuleListItem({
  module,
  moduleNumber,
  onGenerateContent,
  isGenerating,
  onClick,
}: ModuleListItemProps) {
  const contentStatus = getModuleContentStatus(module);

  // Get icon based on module type
  const getModuleIcon = () => {
    const iconClass = 'w-5 h-5';
    switch (module.type) {
      case 'lesson':
        return <Book className={iconClass} />;
      case 'exercise':
        return <Code className={iconClass} />;
      case 'quiz':
        return <ClipboardList className={iconClass} />;
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (isGenerating) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
          <Loader2 className="w-3 h-3 animate-spin" />
          Generating
        </span>
      );
    }

    if (contentStatus === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
          <CheckCircle className="w-3 h-3" />
          Completed
        </span>
      );
    }

    if (contentStatus === 'generated') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
          <Circle className="w-3 h-3" />
          Ready
        </span>
      );
    }

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onGenerateContent(module.id);
        }}
        disabled={isGenerating}
        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Sparkles className="w-3 h-3" />
        Generate
      </button>
    );
  };

  const isClickable = contentStatus !== 'not-generated' && !isGenerating;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg
        ${isClickable ? 'hover:border-blue-500 hover:shadow-sm cursor-pointer' : ''}
        transition-all
      `}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Module number and icon */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-full font-semibold text-sm">
            {moduleNumber}
          </div>
          <div className="text-gray-600">
            {getModuleIcon()}
          </div>
        </div>

        {/* Module info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {module.title}
          </h3>
          <p className="text-sm text-gray-500 capitalize">
            {module.type}
          </p>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0 ml-4">
        {getStatusBadge()}
      </div>
    </div>
  );
}
