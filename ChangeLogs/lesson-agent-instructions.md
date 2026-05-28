# Personal Lesson Agent - Development Instructions

## Project Overview

Build an AI-powered desktop learning application that creates personalized courses with lessons, exercises, and quizzes. The app uses a hierarchical context system (User → Subject → Course → Module) and integrates with Claude AI via OpenRouter API for intelligent content generation and tutoring.

## Core Concepts

### Hierarchical Structure
```
User (Global preferences, IDE choice)
└── Subject (e.g., "Embedded Development", "Audio DSP")
    └── Course (e.g., "ARM Cortex-M Interrupts")
        └── Module (Lesson, Exercise, or Quiz)
```

### Context System
Each level has a JSON context file that inherits from parent levels:
- `user-context.json` - Global user preferences
- `subject-context.json` - Subject-specific tools, hardware, background
- `course-context.json` - Course goals, prerequisites, learning path
- `module-context.json` - Module-specific metadata

When AI interacts with a module, it receives merged context from all parent levels.

### Data Storage Location
Store all user data in a dedicated directory:
- **Development**: `~/personal-lesson-agent-data/`
- **Production**: Use Electron's `app.getPath('userData')` + `/learning-data/`

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Desktop**: Electron
- **AI Integration**: OpenRouter API (Claude models)
- **Icons**: Lucide React (NO emojis in UI)
- **Database**: JSON files on filesystem (no SQLite for MVP)
- **Markdown Rendering**: react-markdown with Mermaid support

## Project Structure to Create

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── Dashboard.tsx          # Main subject list view
│   │   ├── SubjectCard.tsx        # Individual subject card
│   │   └── NewSubjectDialog.tsx   # Create new subject modal
│   ├── SubjectView/
│   │   ├── SubjectView.tsx        # Course list for a subject
│   │   ├── CourseCard.tsx         # Individual course card
│   │   └── SubjectContextPanel.tsx # Show/edit subject context
│   ├── CourseCreation/
│   │   ├── InterviewFlow.tsx      # AI-driven interview component
│   │   ├── CoursePlanReview.tsx   # Review generated course outline
│   │   └── GenerationProgress.tsx # Progress indicator during generation
│   ├── CourseView/
│   │   ├── CourseView.tsx         # Module list for a course
│   │   ├── ModuleListItem.tsx     # Individual module in list
│   │   └── CourseContextPanel.tsx # Show/edit course context
│   ├── ModuleView/
│   │   ├── LessonView.tsx         # Lesson with markdown + AI chat
│   │   ├── ExerciseView.tsx       # Exercise description + project files
│   │   ├── QuizView.tsx           # Quiz interface
│   │   └── AITutorChat.tsx        # Side-by-side AI chat component
│   ├── Shared/
│   │   ├── MarkdownRenderer.tsx   # Markdown with Mermaid support
│   │   ├── ContextEditor.tsx      # JSON context editor
│   │   ├── Header.tsx             # App header with navigation
│   │   └── Button.tsx             # Reusable button component
│   └── Setup/
│       └── UserProfileSetup.tsx   # First-launch user profile creation
├── services/
│   ├── api/
│   │   ├── openrouter.ts          # OpenRouter API client
│   │   └── models.ts              # Model configurations
│   ├── agents/
│   │   ├── Agent.ts               # Base agent class
│   │   ├── InterviewAgent.ts      # Handles subject/course interviews
│   │   ├── CourseDesignerAgent.ts # Creates course structure
│   │   ├── ContentGeneratorAgent.ts # Generates lessons/exercises/quizzes
│   │   └── TutorAgent.ts          # Handles Q&A with context
│   ├── storage/
│   │   ├── FileSystemService.ts   # File operations
│   │   ├── ContextManager.ts      # Load/merge/save contexts
│   │   └── DataPaths.ts           # Path utilities for data directory
│   └── tools/
│       ├── FileTools.ts           # Tools for AI to create/edit files
│       ├── IDELauncher.ts         # Launch JetBrains IDEs
│       └── ToolExecutor.ts        # Execute tool calls from AI
├── types/
│   ├── context.ts                 # Context type definitions
│   ├── module.ts                  # Module type definitions
│   ├── course.ts                  # Course type definitions
│   └── agent.ts                   # Agent-related types
├── hooks/
│   ├── useContext.ts              # Hook for loading hierarchical context
│   ├── useAgent.ts                # Hook for AI agent interactions
│   └── useFileSystem.ts           # Hook for file operations
├── utils/
│   ├── contextMerger.ts           # Merge contexts from hierarchy
│   └── pathHelpers.ts             # Path manipulation utilities
└── App.tsx                        # Main app with routing

electron/
├── main.ts                        # Already exists
├── ipc/
│   ├── fileSystem.ts              # IPC handlers for file operations
│   ├── ideIntegration.ts          # IPC handlers for IDE launching
│   └── handlers.ts                # Register all IPC handlers
└── preload.ts                     # Expose safe IPC to renderer
```

## Type Definitions

### Core Types (src/types/context.ts)
```typescript
export interface UserContext {
  name?: string;
  preferredIDE: string; // 'idea' | 'pycharm' | 'webstorm' | 'code' | etc.
  learningStylePreference: 'hands-on' | 'theory-first' | 'balanced';
  createdAt: string;
}

export interface SubjectContext {
  subjectName: string;
  subjectId: string; // kebab-case version of name
  createdAt: string;
  // Flexible - AI determines relevant fields
  [key: string]: any;
}

export interface CourseContext {
  courseName: string;
  courseId: string;
  goal: string;
  prerequisitesCovered: string[];
  // Flexible - AI determines relevant fields
  [key: string]: any;
}

export interface ModuleContext {
  moduleId: string;
  type: 'lesson' | 'exercise' | 'quiz';
  title: string;
  completed: boolean;
  // Flexible - AI determines relevant fields
  [key: string]: any;
}

export interface HierarchicalContext {
  user: UserContext;
  subject: SubjectContext;
  course: CourseContext;
  module: ModuleContext;
}
```

### Module Types (src/types/module.ts)
```typescript
export interface BaseModule {
  id: string;
  type: 'lesson' | 'exercise' | 'quiz';
  title: string;
  completed: boolean;
  order: number;
}

export interface Lesson extends BaseModule {
  type: 'lesson';
  contentPath: string; // Path to markdown file
}

export interface Exercise extends BaseModule {
  type: 'exercise';
  descriptionPath: string; // Path to description markdown
  projectPath: string; // Path to project folder
}

export interface Quiz extends BaseModule {
  type: 'quiz';
  questionsPath: string; // Path to questions JSON
}

export type Module = Lesson | Exercise | Quiz;
```

## AI Integration Details

### OpenRouter Configuration (src/services/api/openrouter.ts)
```typescript
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Default model - can be changed per agent
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.6';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export async function chatCompletion(
  messages: Message[],
  systemPrompt: string,
  tools?: Tool[],
  model: string = DEFAULT_MODEL
): Promise<any> {
  // Implementation using OpenRouter API
  // Handle tool calls in response
  // Return parsed response
}
```

### Agent Base Class (src/services/agents/Agent.ts)
```typescript
export abstract class Agent {
  protected model: string;
  
  constructor(model?: string) {
    this.model = model || DEFAULT_MODEL;
  }
  
  abstract getSystemPrompt(context?: any): string;
  abstract getTools(): Tool[];
  
  async run(
    userInput: string,
    context: HierarchicalContext | Partial<HierarchicalContext>
  ): Promise<any> {
    const systemPrompt = this.getSystemPrompt(context);
    const tools = this.getTools();
    let messages: Message[] = [{ role: 'user', content: userInput }];
    
    // Tool-use loop
    while (true) {
      const response = await chatCompletion(messages, systemPrompt, tools, this.model);
      
      if (response.stop_reason === 'end_turn') {
        return response.content;
      }
      
      if (response.stop_reason === 'tool_use') {
        // Execute tools and add results to messages
        const toolResults = await this.executeTools(response.tool_calls);
        messages.push(...toolResults);
        continue;
      }
    }
  }
  
  private async executeTools(toolCalls: any[]): Promise<Message[]> {
    // Execute each tool call and format results
  }
}
```

### Interview Agent (src/services/agents/InterviewAgent.ts)
```typescript
export class InterviewAgent extends Agent {
  private interviewType: 'subject' | 'course';
  
  constructor(interviewType: 'subject' | 'course') {
    super();
    this.interviewType = interviewType;
  }
  
  getSystemPrompt(context?: Partial<HierarchicalContext>): string {
    if (this.interviewType === 'subject') {
      return `You are conducting an interview to understand what subject the learner wants to study.
      
User Context: ${JSON.stringify(context?.user || {})}

Your job:
1. Ask 3-5 questions to understand:
   - What specifically they want to learn
   - What tools/hardware/resources they have (if relevant)
   - Their background knowledge in related areas
   - Their learning goals
2. Be conversational and adaptive
3. When you have enough information, use the complete_subject_interview tool

Keep questions focused and relevant to the subject matter.`;
    } else {
      return `You are conducting an interview to design a course.

Full Context: ${JSON.stringify(context || {})}

Your job:
1. Ask 5-8 questions to understand:
   - Specific learning objectives for this course
   - Current knowledge level on this topic
   - Preferred balance of theory vs. practice
   - Time commitment per session
   - End goal or project they want to build
2. Be adaptive based on their responses
3. When ready, use the complete_course_interview tool

You already know their general subject context, so focus on THIS specific course.`;
    }
  }
  
  getTools(): Tool[] {
    return [
      {
        name: 'complete_subject_interview',
        description: 'Call this when you have gathered sufficient information about the subject',
        input_schema: {
          type: 'object',
          properties: {
            subjectName: { type: 'string' },
            subjectContext: { 
              type: 'object',
              description: 'Flexible JSON with relevant fields for this subject'
            }
          },
          required: ['subjectName', 'subjectContext']
        }
      },
      {
        name: 'complete_course_interview',
        description: 'Call this when you have gathered sufficient information about the course',
        input_schema: {
          type: 'object',
          properties: {
            courseName: { type: 'string' },
            courseContext: {
              type: 'object',
              description: 'Flexible JSON with relevant fields for this course'
            }
          },
          required: ['courseName', 'courseContext']
        }
      }
    ];
  }
}
```

### Course Designer Agent (src/services/agents/CourseDesignerAgent.ts)
```typescript
export class CourseDesignerAgent extends Agent {
  getSystemPrompt(context: HierarchicalContext): string {
    return `You are designing a course curriculum.

Full Context: ${JSON.stringify(context)}

Create a structured course outline with:
- 5-10 modules (lessons, exercises, quizzes)
- Logical progression from basics to advanced
- Mix of theory and practice appropriate to the subject
- Each module should have a clear learning objective

Consider:
- User's background knowledge
- Available tools/hardware
- Learning style preference
- Course goals

Return the outline using the create_course_outline tool.`;
  }
  
  getTools(): Tool[] {
    return [
      {
        name: 'create_course_outline',
        description: 'Create the course structure with modules',
        input_schema: {
          type: 'object',
          properties: {
            modules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { 
                    type: 'string',
                    enum: ['lesson', 'exercise', 'quiz']
                  },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  order: { type: 'number' }
                }
              }
            }
          },
          required: ['modules']
        }
      }
    ];
  }
}
```

### Content Generator Agent (src/services/agents/ContentGeneratorAgent.ts)
```typescript
export class ContentGeneratorAgent extends Agent {
  getSystemPrompt(context: HierarchicalContext): string {
    return `You are generating educational content.

Full Context: ${JSON.stringify(context)}

Generate content appropriate to the module type:

LESSONS:
- Use markdown format
- Include diagrams using Mermaid syntax where helpful
- Can include SVG for custom visualizations
- Reference specific tools/hardware from context
- Clear explanations with examples

EXERCISES:
- Create project files appropriate to the subject
- Include starter code with TODO comments
- Provide clear instructions in README.md
- Include test criteria
- Reference actual tools/hardware user has

QUIZZES:
- Mix question types (multiple choice, short answer, code completion)
- Reference concepts from previous lessons
- Include explanations for answers

Use the appropriate tool to create the content.`;
  }
  
  getTools(): Tool[] {
    return [
      {
        name: 'create_lesson_content',
        description: 'Create markdown content for a lesson',
        input_schema: {
          type: 'object',
          properties: {
            markdown: { type: 'string' }
          },
          required: ['markdown']
        }
      },
      {
        name: 'create_exercise_files',
        description: 'Create exercise project files',
        input_schema: {
          type: 'object',
          properties: {
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  content: { type: 'string' }
                }
              }
            },
            description: { type: 'string' }
          },
          required: ['files', 'description']
        }
      },
      {
        name: 'create_quiz_questions',
        description: 'Create quiz questions',
        input_schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { 
                    type: 'string',
                    enum: ['multiple-choice', 'short-answer', 'code-completion']
                  },
                  question: { type: 'string' },
                  options: { 
                    type: 'array',
                    items: { type: 'string' }
                  },
                  correctAnswer: { type: 'string' },
                  explanation: { type: 'string' }
                }
              }
            }
          },
          required: ['questions']
        }
      }
    ];
  }
}
```

### Tutor Agent (src/services/agents/TutorAgent.ts)
```typescript
export class TutorAgent extends Agent {
  getSystemPrompt(context: HierarchicalContext): string {
    return `You are a personalized AI tutor helping the learner understand the current module.

Full Context: ${JSON.stringify(context)}

Current Module Content: ${context.module.content || '[Content not loaded]'}

Your role:
- Answer questions about the current lesson/exercise
- Provide hints without giving away answers
- Explain concepts using examples relevant to their tools/hardware
- Be encouraging and supportive
- Reference previous modules if helpful
- Adapt explanations to their learning style

DO NOT:
- Give complete solutions to exercises immediately
- Go off-topic from the current learning path
- Make assumptions not supported by the context`;
  }
  
  getTools(): Tool[] {
    // Tutor typically doesn't need tools, just conversational
    return [];
  }
}
```

## File System Service (src/services/storage/FileSystemService.ts)

This service handles all file operations through Electron IPC for security.

```typescript
// Renderer side - uses IPC
export class FileSystemService {
  async readFile(path: string): Promise<string> {
    return window.electron.readFile(path);
  }
  
  async writeFile(path: string, content: string): Promise<void> {
    return window.electron.writeFile(path, content);
  }
  
  async readJSON<T>(path: string): Promise<T> {
    const content = await this.readFile(path);
    return JSON.parse(content);
  }
  
  async writeJSON(path: string, data: any): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    return this.writeFile(path, content);
  }
  
  async createDirectory(path: string): Promise<void> {
    return window.electron.createDirectory(path);
  }
  
  async listDirectory(path: string): Promise<string[]> {
    return window.electron.listDirectory(path);
  }
  
  async exists(path: string): Promise<boolean> {
    return window.electron.exists(path);
  }
}
```

## Context Manager (src/services/storage/ContextManager.ts)

```typescript
export class ContextManager {
  constructor(private fs: FileSystemService) {}
  
  async loadHierarchicalContext(
    subjectId?: string,
    courseId?: string,
    moduleId?: string
  ): Promise<Partial<HierarchicalContext>> {
    const context: Partial<HierarchicalContext> = {};
    
    // Load user context
    const userPath = getDataPath('user-context.json');
    if (await this.fs.exists(userPath)) {
      context.user = await this.fs.readJSON<UserContext>(userPath);
    }
    
    // Load subject context if specified
    if (subjectId) {
      const subjectPath = getDataPath(`${subjectId}/subject-context.json`);
      if (await this.fs.exists(subjectPath)) {
        context.subject = await this.fs.readJSON<SubjectContext>(subjectPath);
      }
    }
    
    // Load course context if specified
    if (subjectId && courseId) {
      const coursePath = getDataPath(`${subjectId}/${courseId}/course-context.json`);
      if (await this.fs.exists(coursePath)) {
        context.course = await this.fs.readJSON<CourseContext>(coursePath);
      }
    }
    
    // Load module context if specified
    if (subjectId && courseId && moduleId) {
      const modulePath = getDataPath(`${subjectId}/${courseId}/${moduleId}/module-context.json`);
      if (await this.fs.exists(modulePath)) {
        context.module = await this.fs.readJSON<ModuleContext>(modulePath);
      }
    }
    
    return context;
  }
  
  async saveContext(
    level: 'user' | 'subject' | 'course' | 'module',
    data: any,
    subjectId?: string,
    courseId?: string,
    moduleId?: string
  ): Promise<void> {
    let path: string;
    
    switch (level) {
      case 'user':
        path = getDataPath('user-context.json');
        break;
      case 'subject':
        path = getDataPath(`${subjectId}/subject-context.json`);
        break;
      case 'course':
        path = getDataPath(`${subjectId}/${courseId}/course-context.json`);
        break;
      case 'module':
        path = getDataPath(`${subjectId}/${courseId}/${moduleId}/module-context.json`);
        break;
    }
    
    await this.fs.writeJSON(path, data);
  }
}
```

## Electron IPC Setup

### Preload Script (electron/preload.ts)
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // File system operations
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
  createDirectory: (path: string) => ipcRenderer.invoke('fs:createDirectory', path),
  listDirectory: (path: string) => ipcRenderer.invoke('fs:listDirectory', path),
  exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
  
  // IDE integration
  openInIDE: (projectPath: string, ide: string) => ipcRenderer.invoke('ide:open', projectPath, ide),
  
  // Get data directory path
  getDataPath: () => ipcRenderer.invoke('app:getDataPath'),
});
```

### IPC Handlers (electron/ipc/fileSystem.ts)
```typescript
import { ipcMain, app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

const getDataDirectory = () => {
  if (process.env.NODE_ENV === 'development') {
    return path.join(require('os').homedir(), 'personal-lesson-agent-data');
  }
  return path.join(app.getPath('userData'), 'learning-data');
};

export function registerFileSystemHandlers() {
  ipcMain.handle('app:getDataPath', () => {
    return getDataDirectory();
  });
  
  ipcMain.handle('fs:readFile', async (event, filePath: string) => {
    const fullPath = path.join(getDataDirectory(), filePath);
    return fs.readFile(fullPath, 'utf-8');
  });
  
  ipcMain.handle('fs:writeFile', async (event, filePath: string, content: string) => {
    const fullPath = path.join(getDataDirectory(), filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    return fs.writeFile(fullPath, content, 'utf-8');
  });
  
  ipcMain.handle('fs:createDirectory', async (event, dirPath: string) => {
    const fullPath = path.join(getDataDirectory(), dirPath);
    return fs.mkdir(fullPath, { recursive: true });
  });
  
  ipcMain.handle('fs:listDirectory', async (event, dirPath: string) => {
    const fullPath = path.join(getDataDirectory(), dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries.map(e => ({
      name: e.name,
      isDirectory: e.isDirectory()
    }));
  });
  
  ipcMain.handle('fs:exists', async (event, filePath: string) => {
    const fullPath = path.join(getDataDirectory(), filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  });
}
```

### IPC Handlers for IDE (electron/ipc/ideIntegration.ts)
```typescript
import { ipcMain } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const IDE_COMMANDS: Record<string, string> = {
  'idea': 'idea',
  'pycharm': 'pycharm',
  'webstorm': 'webstorm',
  'code': 'code',
  'rider': 'rider',
  'clion': 'clion',
  'goland': 'goland',
};

export function registerIDEHandlers() {
  ipcMain.handle('ide:open', async (event, projectPath: string, ide: string) => {
    const command = IDE_COMMANDS[ide];
    if (!command) {
      throw new Error(`Unknown IDE: ${ide}`);
    }
    
    try {
      await execAsync(`${command} "${projectPath}"`);
      return { success: true };
    } catch (error) {
      // Fallback: open in system file browser
      const { shell } = require('electron');
      await shell.openPath(projectPath);
      return { success: true, usedFallback: true };
    }
  });
}
```

### Register Handlers in Main (electron/main.ts)
```typescript
import { registerFileSystemHandlers } from './ipc/fileSystem';
import { registerIDEHandlers } from './ipc/ideIntegration';

// In your app.whenReady() callback:
registerFileSystemHandlers();
registerIDEHandlers();
```

## UI Components Guidelines

### Design Principles
- **NO EMOJIS** - Use Lucide React icons instead
- Clean, professional interface
- Consistent spacing with Tailwind
- Responsive layouts
- Clear visual hierarchy
- Accessible (proper ARIA labels, keyboard navigation)

### Icon Usage
```typescript
import { Book, Code, CheckCircle, Circle, Plus, Settings, ChevronRight } from 'lucide-react';

// Example usage
<Book className="w-5 h-5" />
<Code className="w-5 h-5 text-blue-600" />
<CheckCircle className="w-4 h-4 text-green-600" />
```

### Common Icon Mappings
- Lesson: `<Book />`
- Exercise: `<Code />`
- Quiz: `<ClipboardList />`
- Complete: `<CheckCircle />`
- Incomplete: `<Circle />`
- Add New: `<Plus />`
- Settings/Edit: `<Settings />`
- Navigate: `<ChevronRight />`
- Back: `<ChevronLeft />`
- AI Chat: `<MessageSquare />`

### Dashboard Component Example
```typescript
import { Book, Plus } from 'lucide-react';

export function Dashboard() {
  const [subjects, setSubjects] = useState<SubjectContext[]>([]);
  
  useEffect(() => {
    loadSubjects();
  }, []);
  
  const loadSubjects = async () => {
    // Load all subject folders from data directory
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">My Learning Subjects</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => setShowNewSubjectDialog(true)}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Subject
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(subject => (
            <SubjectCard key={subject.subjectId} subject={subject} />
          ))}
        </div>
      </main>
    </div>
  );
}
```

### Lesson View with Split Pane Example
```typescript
export function LessonView({ module, context }: { module: Lesson; context: HierarchicalContext }) {
  const [markdown, setMarkdown] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    loadLessonContent();
  }, [module]);
  
  return (
    <div className="flex h-screen">
      {/* Lesson Content - Left Side */}
      <div className="flex-1 overflow-y-auto p-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ChevronLeft className="w-4 h-4" />
            Back to Course
          </button>
          
          <h1 className="text-3xl font-bold mb-6">{module.title}</h1>
          
          <MarkdownRenderer content={markdown} />
          
          <button className="mt-8 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Mark Complete
          </button>
        </div>
      </div>
      
      {/* AI Tutor Chat - Right Side */}
      <div className="w-96 border-l bg-gray-50 flex flex-col">
        <div className="p-4 bg-white border-b flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold">AI Tutor</h2>
        </div>
        
        <AITutorChat 
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          context={context}
        />
      </div>
    </div>
  );
}
```

## Markdown Rendering with Mermaid

Install dependencies:
```bash
npm install react-markdown remark-gfm mermaid
```

Component (src/components/Shared/MarkdownRenderer.tsx):
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

export function MarkdownRenderer({ content }: { content: string }) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
    if (mermaidRef.current) {
      mermaid.contentLoaded();
    }
  }, [content]);
  
  return (
    <div ref={mermaidRef} className="prose prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (language === 'mermaid' && !inline) {
              return (
                <div className="mermaid">
                  {String(children).replace(/\n$/, '')}
                </div>
              );
            }
            
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

## Environment Variables

Create `.env` file in root:
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Access in code:
```typescript
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
```

Add to vite.config.ts:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  // ... other config
  define: {
    'process.env.OPENROUTER_API_KEY': JSON.stringify(process.env.OPENROUTER_API_KEY)
  }
});
```

## Routing

Use React Router for navigation:
```bash
npm install react-router-dom
```

Setup routes in App.tsx:
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/subject/:subjectId" element={<SubjectView />} />
        <Route path="/subject/:subjectId/course/:courseId" element={<CourseView />} />
        <Route path="/subject/:subjectId/course/:courseId/module/:moduleId" element={<ModuleView />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Implementation Priority

### Phase 1: Foundation
1. Set up IPC handlers for file system operations
2. Create data directory structure on first launch
3. Implement FileSystemService and ContextManager
4. Build user profile setup screen
5. Create Dashboard with subject list

### Phase 2: Subject & Course Creation
1. Implement InterviewAgent
2. Build InterviewFlow component
3. Create new subject flow
4. Implement CourseDesignerAgent
5. Build course creation interview and plan review

### Phase 3: Content Generation
1. Implement ContentGeneratorAgent with all tools
2. Create progress indicator during generation
3. Build file/folder structure for modules
4. Implement SubjectView and CourseView

### Phase 4: Learning Interface
1. Build LessonView with markdown rendering
2. Implement Mermaid diagram support
3. Add SVG rendering capabilities
4. Create ExerciseView with project file display
5. Implement QuizView

### Phase 5: AI Tutoring
1. Implement TutorAgent
2. Build AITutorChat component
3. Integrate chat with all module views
4. Add context loading for tutor

### Phase 6: IDE Integration & Polish
1. Implement IDE launcher functionality
2. Add "Open in IDE" buttons for exercises
3. Build context editor component
4. Add edit/regenerate capabilities
5. Polish UI and fix bugs

## Testing Approach

For early development:
1. Test with mock data first (hard-coded contexts)
2. Test AI agents independently in isolation
3. Gradually integrate pieces together
4. Manual testing for UI flows

## Key Implementation Notes

1. **Error Handling**: Wrap all AI calls and file operations in try-catch
2. **Loading States**: Show spinners/progress for all async operations
3. **Validation**: Validate JSON context files before parsing
4. **Path Safety**: Always use path.join() and sanitize user input in paths
5. **API Rate Limiting**: Consider adding delays between rapid AI calls
6. **Context Size**: Monitor context size sent to AI (may need truncation for very large contexts)
7. **Streaming**: Consider implementing streaming responses for better UX in chat
8. **Persistence**: Save user progress frequently (after each module completion)

## Additional Dependencies to Install

```bash
npm install lucide-react
npm install react-markdown remark-gfm
npm install mermaid
npm install react-router-dom
npm install @types/node
```

## File Naming Conventions

- Component files: PascalCase (e.g., `Dashboard.tsx`)
- Service files: PascalCase (e.g., `FileSystemService.ts`)
- Type files: camelCase (e.g., `context.ts`)
- Utility files: camelCase (e.g., `pathHelpers.ts`)
- Context files on disk: kebab-case (e.g., `user-context.json`)
- Module folders: kebab-case with type prefix (e.g., `lesson-01-basics/`, `exercise-02-button/`)

## Success Criteria

The MVP is complete when:
1. ✅ User can create a profile
2. ✅ User can create subjects via AI interview
3. ✅ User can create courses via AI interview
4. ✅ AI generates complete course structure with modules
5. ✅ User can view and navigate lessons
6. ✅ Lessons render markdown with Mermaid diagrams
7. ✅ User can ask AI questions about lessons in side-by-side chat
8. ✅ AI generates exercise project files
9. ✅ User can open exercises in their IDE
10. ✅ User can manually edit context files
11. ✅ Context hierarchy properly merges for AI interactions

---

## Notes for Claude Code

- Start with Phase 1 to establish foundation
- Test file operations thoroughly before moving to AI integration
- Use TypeScript strictly - avoid `any` types where possible
- Follow the type definitions provided exactly
- Implement error boundaries for robustness
- Add console.logs during development for debugging
- Comment complex logic, especially in Agent classes
- Keep components focused and single-responsibility
- Extract reusable logic into hooks
- Maintain consistent code style throughout