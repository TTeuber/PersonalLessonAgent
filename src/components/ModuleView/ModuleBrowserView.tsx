import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, CheckCircle, MessageSquare, File, Folder, ChevronRight, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { Module } from '../../types/module';
import type { HierarchicalContext } from '../../types/context';
import type { QuizQuestion } from '../../types/module';
import { MarkdownRenderer } from '../Shared/MarkdownRenderer';
import { QuizQuestionsViewer } from './QuizQuestionsViewer';
import { AITutorChat } from './AITutorChat';
import { FileSystemService } from '../../services/storage/FileSystemService';
import { getModulePath } from '../../services/storage/DataPaths';

interface ModuleBrowserViewProps {
  module: Module;
  context: HierarchicalContext;
  onComplete: () => void;
  onBack: () => void;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  expanded?: boolean;
}

export function ModuleBrowserView({ module, context, onComplete, onBack }: ModuleBrowserViewProps) {
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showFileTree, setShowFileTree] = useState(true);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileType, setFileType] = useState<'markdown' | 'json' | 'code' | 'text'>('text');
  const [chatWidth, setChatWidth] = useState(384);
  const [fileTreeWidth, setFileTreeWidth] = useState(256);
  const [isResizingChat, setIsResizingChat] = useState(false);
  const [isResizingFileTree, setIsResizingFileTree] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadModuleFiles();
  }, [module.id]);

  // Handle chat resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingChat || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;
      const constrainedWidth = Math.max(300, Math.min(800, newWidth));
      setChatWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingChat(false);
    };

    if (isResizingChat) {
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
  }, [isResizingChat]);

  // Handle file tree resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingFileTree || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const constrainedWidth = Math.max(200, Math.min(600, newWidth));
      setFileTreeWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingFileTree(false);
    };

    if (isResizingFileTree) {
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
  }, [isResizingFileTree]);

  const loadModuleFiles = async () => {
    try {
      setLoading(true);
      const fs = new FileSystemService();
      const modulePath = getModulePath(
        context.subject!.subjectId,
        context.course!.courseId,
        module.id
      );

      // Load file tree
      const entries = await fs.listDirectory(modulePath);
      const nodes: FileNode[] = [];

      for (const entry of entries) {
        nodes.push({
          name: entry.name,
          path: `${modulePath}/${entry.name}`,
          isDirectory: entry.isDirectory,
          expanded: false,
        });
      }

      setFileTree(nodes);

      // Auto-select first markdown file or first file
      const firstMd = nodes.find(n => !n.isDirectory && n.name.endsWith('.md'));
      const firstFile = firstMd || nodes.find(n => !n.isDirectory);

      if (firstFile) {
        await selectFile(firstFile);
      }
    } catch (error) {
      console.error('Error loading module files:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDirectory = async (node: FileNode) => {
    if (!node.isDirectory) return;

    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(n => {
        if (n.path === node.path) {
          return { ...n, expanded: !n.expanded };
        }
        if (n.children) {
          return { ...n, children: updateTree(n.children) };
        }
        return n;
      });
    };

    // If expanding and no children loaded yet, load them
    if (!node.expanded && !node.children) {
      try {
        const fs = new FileSystemService();
        const entries = await fs.listDirectory(node.path);
        const children: FileNode[] = entries.map(entry => ({
          name: entry.name,
          path: `${node.path}/${entry.name}`,
          isDirectory: entry.isDirectory,
          expanded: false,
        }));

        const updateTreeWithChildren = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(n => {
            if (n.path === node.path) {
              return { ...n, expanded: true, children };
            }
            if (n.children) {
              return { ...n, children: updateTreeWithChildren(n.children) };
            }
            return n;
          });
        };

        setFileTree(updateTreeWithChildren(fileTree));
      } catch (error) {
        console.error('Error loading directory:', error);
      }
    } else {
      setFileTree(updateTree(fileTree));
    }
  };

  const selectFile = async (node: FileNode) => {
    if (node.isDirectory) {
      toggleDirectory(node);
      return;
    }

    try {
      const fs = new FileSystemService();
      const content = await fs.readFile(node.path);
      setFileContent(content);
      setSelectedFile(node.path);

      // Determine file type
      if (node.name.endsWith('.md')) {
        setFileType('markdown');
      } else if (node.name.endsWith('.json')) {
        setFileType('json');
      } else if (
        node.name.endsWith('.js') ||
        node.name.endsWith('.ts') ||
        node.name.endsWith('.tsx') ||
        node.name.endsWith('.jsx') ||
        node.name.endsWith('.py') ||
        node.name.endsWith('.java') ||
        node.name.endsWith('.cpp') ||
        node.name.endsWith('.c') ||
        node.name.endsWith('.h') ||
        node.name.endsWith('.css') ||
        node.name.endsWith('.html')
      ) {
        setFileType('code');
      } else {
        setFileType('text');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setFileContent('Error loading file content.');
      setFileType('text');
    }
  };

  const handleMarkComplete = () => {
    if (confirm('Mark this module as complete?')) {
      onComplete();
    }
  };

  const renderFileTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <button
          onClick={() => selectFile(node)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            selectedFile === node.path
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'text-gray-700 dark:text-gray-300'
          }`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          {node.isDirectory ? (
            node.expanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )
          ) : (
            <div className="w-4" />
          )}
          {node.isDirectory ? (
            <Folder className="w-4 h-4 flex-shrink-0" />
          ) : (
            <File className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {node.isDirectory && node.expanded && node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  const renderContent = () => {
    if (!selectedFile) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>Select a file to view its contents</p>
        </div>
      );
    }

    if (fileType === 'markdown') {
      return (
        <div className="flex-1 overflow-y-auto px-6 py-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto prose-container">
            <MarkdownRenderer content={fileContent} />
          </div>
        </div>
      );
    }

    if (fileType === 'json' && selectedFile.endsWith('questions.json')) {
      try {
        const data = JSON.parse(fileContent);
        const questions = data.questions || data;

        return (
          <div className="flex-1 overflow-y-auto px-6 py-8 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto">
              <QuizQuestionsViewer questions={questions as QuizQuestion[]} />
            </div>
          </div>
        );
      } catch (error) {
        console.error('Error parsing JSON:', error);
        return (
          <div className="flex-1 overflow-y-auto p-4 bg-gray-900 dark:bg-gray-950">
            <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
              {fileContent}
            </pre>
          </div>
        );
      }
    }

    if (fileType === 'code' || fileType === 'json') {
      return (
        <div className="flex-1 overflow-y-auto bg-gray-900 dark:bg-gray-950">
          <pre className="p-4 text-sm text-gray-100 font-mono whitespace-pre-wrap">
            {fileContent}
          </pre>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
        <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
          {fileContent}
        </pre>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar - File Tree */}
      {showFileTree && (
        <>
          <div
            className="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col flex-shrink-0"
            style={{ width: `${fileTreeWidth}px` }}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Files</h3>
              <button
                onClick={() => setShowFileTree(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Hide file tree"
              >
                <PanelLeftClose className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 p-4">Loading files...</p>
              ) : fileTree.length > 0 ? (
                renderFileTree(fileTree)
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 p-4">No files found</p>
              )}
            </div>
          </div>

          {/* Resize Handle for File Tree */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingFileTree(true);
            }}
            className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-ew-resize transition-colors flex-shrink-0"
            style={{ touchAction: 'none' }}
          />
        </>
      )}

      {/* Center - Content Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Course</span>
            </button>
            {!showFileTree && (
              <button
                onClick={() => setShowFileTree(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Show file tree"
              >
                <PanelLeftOpen className="w-4 h-4" />
                <span>Files</span>
              </button>
            )}
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

        {/* Module Title */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{module.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {module.type.charAt(0).toUpperCase() + module.type.slice(1)} #{module.order}
            {selectedFile && (
              <span className="ml-2">• {selectedFile.split('/').pop()}</span>
            )}
          </p>
        </div>

        {/* Content */}
        {renderContent()}
      </div>

      {/* Right Sidebar - AI Tutor Chat */}
      {showChat && (
        <>
          {/* Resize Handle for Chat */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingChat(true);
            }}
            className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-500 cursor-ew-resize transition-colors flex-shrink-0"
            style={{ touchAction: 'none' }}
          />

          {/* Chat Panel */}
          <div
            className="border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col flex-shrink-0"
            style={{ width: `${chatWidth}px` }}
          >
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">AI Tutor</h2>
            </div>
            <AITutorChat context={context} moduleContent={fileContent} />
          </div>
        </>
      )}
    </div>
  );
}
