import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, CheckCircle, MessageSquare, BookOpen } from 'lucide-react';
import type { Lesson } from '../../types/module';
import type { HierarchicalContext } from '../../types/context';
import { MarkdownRenderer } from '../Shared/MarkdownRenderer';
import { AITutorChat } from './AITutorChat';
import { FileSystemService } from '../../services/storage/FileSystemService';

interface LessonViewProps {
  module: Lesson;
  context: HierarchicalContext;
  onComplete: () => void;
  onBack: () => void;
}

export function LessonView({ module, context, onComplete, onBack }: LessonViewProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [chatWidth, setChatWidth] = useState(384); // Default 384px (w-96)
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadLessonContent = useCallback(async () => {
    try {
      setLoading(true);
      const fs = new FileSystemService();
      const lessonContent = await fs.readFile(module.contentPath);
      setContent(lessonContent);
    } catch (error) {
      console.error('Error loading lesson content:', error);
      setContent('# Error Loading Lesson\n\nFailed to load lesson content. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [module.contentPath]);

  useEffect(() => {
    loadLessonContent();
  }, [loadLessonContent]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;

      // Constrain width between 300px and 800px
      const constrainedWidth = Math.max(300, Math.min(800, newWidth));
      setChatWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleMarkComplete = () => {
    if (confirm('Mark this lesson as complete?')) {
      onComplete();
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <div ref={containerRef} className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Lesson Content - Left Side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Course</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{showChat ? 'Hide' : 'Show'} Tutor</span>
            </button>
            {!module.completed && (
              <button
                onClick={handleMarkComplete}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Complete</span>
              </button>
            )}
            {module.completed && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span>Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Lesson Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{module.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lesson #{module.order}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading lesson...</p>
                </div>
              </div>
            ) : (
              <div className="prose-container">
                <MarkdownRenderer content={content} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Tutor Chat - Right Side with Resize Handle */}
      {showChat && (
        <>
          {/* Resize Handle */}
          <div
            onMouseDown={handleResizeStart}
            className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-ew-resize transition-colors flex-shrink-0"
            style={{ touchAction: 'none' }}
          />

          {/* Chat Panel */}
          <div
            className="border-l dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col flex-shrink-0"
            style={{ width: `${chatWidth}px` }}
          >
            <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">AI Tutor</h2>
            </div>
            <AITutorChat context={context} moduleContent={content} />
          </div>
        </>
      )}
    </div>
  );
}
