import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadLessonContent();
  }, [module.contentPath]);

  const loadLessonContent = async () => {
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
  };

  const handleMarkComplete = () => {
    if (confirm('Mark this lesson as complete?')) {
      onComplete();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Lesson Content - Left Side */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Course</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{showChat ? 'Hide' : 'Show'} Tutor</span>
            </button>
            {!module.completed && (
              <button
                onClick={handleMarkComplete}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Complete</span>
              </button>
            )}
            {module.completed && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span>Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Lesson Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
                <p className="text-sm text-gray-500 mt-1">Lesson #{module.order}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading lesson...</p>
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

      {/* AI Tutor Chat - Right Side */}
      {showChat && (
        <div className="w-96 border-l bg-gray-50 flex flex-col">
          <div className="p-4 bg-white border-b flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">AI Tutor</h2>
          </div>
          <AITutorChat context={context} moduleContent={content} />
        </div>
      )}
    </div>
  );
}
