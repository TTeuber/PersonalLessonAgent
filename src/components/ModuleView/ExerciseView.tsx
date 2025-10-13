import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, MessageSquare, Code, ExternalLink, File, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import type { Exercise } from '../../types/module';
import type { HierarchicalContext } from '../../types/context';
import { MarkdownRenderer } from '../Shared/MarkdownRenderer';
import { AITutorChat } from './AITutorChat';
import { FileSystemService } from '../../services/storage/FileSystemService';

interface ExerciseViewProps {
  module: Exercise;
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

export function ExerciseView({ module, context, onComplete, onBack }: ExerciseViewProps) {
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  useEffect(() => {
    loadExerciseData();
  }, [module.descriptionPath, module.projectPath]);

  const loadExerciseData = async () => {
    try {
      setLoading(true);
      const fs = new FileSystemService();

      // Load description
      const desc = await fs.readFile(module.descriptionPath);
      setDescription(desc);

      // Load project file tree
      await loadFileTree(module.projectPath);
    } catch (error) {
      console.error('Error loading exercise data:', error);
      setDescription('# Error Loading Exercise\n\nFailed to load exercise content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadFileTree = async (path: string) => {
    try {
      const fs = new FileSystemService();
      const entries = await fs.listDirectory(path);

      const nodes: FileNode[] = [];
      for (const entry of entries) {
        nodes.push({
          name: entry.name,
          path: `${path}/${entry.name}`,
          isDirectory: entry.isDirectory,
          expanded: false,
        });
      }

      setFileTree(nodes);
    } catch (error) {
      console.error('Error loading file tree:', error);
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
    } catch (error) {
      console.error('Error loading file:', error);
      setFileContent('Error loading file content.');
    }
  };

  const handleOpenInIDE = async () => {
    const ide = context.user?.preferredIDE || 'code';
    try {
      await window.electron.openInIDE(module.projectPath, ide);
    } catch (error) {
      console.error('Error opening IDE:', error);
      alert('Failed to open IDE. The project folder will open in your file browser instead.');
    }
  };

  const handleMarkComplete = () => {
    if (confirm('Mark this exercise as complete?')) {
      onComplete();
    }
  };

  const renderFileTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <button
          onClick={() => selectFile(node)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
            selectedFile === node.path ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          {node.isDirectory ? (
            node.expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : null}
          {node.isDirectory ? (
            <Folder className="w-4 h-4" />
          ) : (
            <File className="w-4 h-4" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {node.isDirectory && node.expanded && node.children && (
          <div>{renderFileTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Exercise Content - Left Side */}
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
              onClick={handleOpenInIDE}
              className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in IDE</span>
            </button>
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

        {/* Exercise Content - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Description and File Tree */}
          <div className="w-1/2 flex flex-col border-r">
            {/* Description */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Code className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
                  <p className="text-sm text-gray-500 mt-1">Exercise #{module.order}</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading exercise...</p>
                  </div>
                </div>
              ) : (
                <MarkdownRenderer content={description} />
              )}
            </div>

            {/* File Tree */}
            <div className="h-64 border-t bg-gray-50">
              <div className="px-4 py-3 bg-white border-b">
                <h3 className="font-semibold text-sm text-gray-900">Project Files</h3>
              </div>
              <div className="overflow-y-auto h-[calc(100%-48px)]">
                {fileTree.length > 0 ? (
                  renderFileTree(fileTree)
                ) : (
                  <p className="text-sm text-gray-500 p-4">No files found</p>
                )}
              </div>
            </div>
          </div>

          {/* File Viewer */}
          <div className="w-1/2 flex flex-col bg-gray-900">
            {selectedFile ? (
              <>
                <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
                  <p className="text-sm text-gray-300 truncate">{selectedFile.split('/').pop()}</p>
                </div>
                <pre className="flex-1 overflow-auto p-4 text-sm text-gray-100 font-mono">
                  {fileContent}
                </pre>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Select a file to view its contents</p>
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
          <AITutorChat context={context} moduleContent={description} />
        </div>
      )}
    </div>
  );
}
