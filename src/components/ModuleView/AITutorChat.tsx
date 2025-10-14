import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import type { HierarchicalContext } from '../../types/context';
import { TutorAgent } from '../../services/agents/TutorAgent';
import { MarkdownRenderer } from '../Shared/MarkdownRenderer';
import { FileSystemService } from '../../services/storage/FileSystemService';
import { ContextManager } from '../../services/storage/ContextManager';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AITutorChatProps {
  context: HierarchicalContext;
  moduleContent?: string;
}

export function AITutorChat({ context, moduleContent }: AITutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const tutorAgent = useRef(new TutorAgent());
  const contextManager = useRef(new ContextManager(new FileSystemService()));

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, [context.subject?.subjectId, context.course?.courseId, context.module?.moduleId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0 && context.subject?.subjectId && context.course?.courseId && context.module?.moduleId) {
      saveChatHistory();
    }
  }, [messages]);

  const loadChatHistory = async () => {
    if (!context.subject?.subjectId || !context.course?.courseId || !context.module?.moduleId) {
      return;
    }

    try {
      const history = await contextManager.current.loadChatHistory(
        context.subject.subjectId,
        context.course.courseId,
        context.module.moduleId
      );
      setMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatHistory = async () => {
    if (!context.subject?.subjectId || !context.course?.courseId || !context.module?.moduleId) {
      return;
    }

    try {
      await contextManager.current.saveChatHistory(
        context.subject.subjectId,
        context.course.courseId,
        context.module.moduleId,
        messages
      );
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Add module content to context if available
      const enrichedContext = {
        ...context,
        module: {
          ...context.module,
          content: moduleContent,
        },
      };

      // Get response from tutor agent
      const response = await tutorAgent.current.run(input, enrichedContext);

      // Extract text content from response
      const assistantContent = response.text || 'I apologize, but I could not generate a response. Please try again.';

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantContent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting tutor response:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mb-3 text-gray-400 dark:text-gray-500" />
            <p className="text-center text-sm">
              Ask me anything about this module!
            </p>
            <p className="text-center text-xs mt-2 text-gray-400 dark:text-gray-500">
              I can help explain concepts, provide hints, and answer questions.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className="flex flex-col items-center"
          >
            {message.role === 'user' ? (
              // User message - centered bubble
              <div className="w-full max-w-2xl">
                <div className="bg-blue-600 text-white rounded-lg px-4 py-3 inline-block max-w-[85%] float-right clear-both">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className="clear-both"></div>
              </div>
            ) : (
              // AI message - centered, full width, markdown
              <div className="w-full max-w-4xl px-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownRenderer content={message.content} />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
