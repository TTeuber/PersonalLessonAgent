import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mermaid with configuration
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });
  }, []);

  useEffect(() => {
    // Re-render mermaid diagrams when content changes
    if (containerRef.current) {
      const mermaidElements = containerRef.current.querySelectorAll('.mermaid');
      mermaidElements.forEach((element, index) => {
        const id = `mermaid-${Date.now()}-${index}`;
        element.setAttribute('data-processed', 'false');
        element.id = id;
      });
      mermaid.run({
        querySelector: '.mermaid',
      }).catch((error) => {
        console.error('Mermaid rendering error:', error);
      });
    }
  }, [content]);

  return (
    <div ref={containerRef} className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-800 dark:prose-invert dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            // Determine if inline based on presence of newlines and language
            const isInline = !className && !codeString.includes('\n');

            // Handle Mermaid diagrams
            if (language === 'mermaid' && !isInline) {
              return (
                <div className="mermaid my-6">
                  {codeString}
                </div>
              );
            }

            // Handle inline code
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }

            // Handle code blocks
            return (
              <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          // Style tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  {children}
                </table>
              </div>
            );
          },
          // Style blockquotes
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 italic my-4 text-gray-700 dark:text-gray-300">
                {children}
              </blockquote>
            );
          },
          // Style images
          img({ src, alt }) {
            return (
              <img
                src={src}
                alt={alt || ''}
                className="max-w-full h-auto rounded-lg shadow-md dark:shadow-gray-900/30 my-6"
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
