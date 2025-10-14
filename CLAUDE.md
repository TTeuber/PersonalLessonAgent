# Personal Lesson Agent - Claude Context Guide

**Last Updated:** October 14, 2025
**Status:** Phase 4 Complete (Phases 1-4 fully functional) + Module Browser System

## Project Overview

The Personal Lesson Agent is an AI-powered desktop learning application built with React, TypeScript, and Electron. It creates personalized educational courses with lessons, exercises, and quizzes, featuring an AI tutor that provides context-aware assistance throughout the learning journey.

### What It Does
- Creates custom learning subjects via form-based AI interview
- Generates complete courses with structured modules
- AI generates all content (lessons, exercises, quizzes)
- Provides side-by-side AI tutoring during learning
- Tracks progress and module completion
- Integrates with IDEs for hands-on exercises

### Current Status: Phase 4 Complete ✅
- ✅ **Phase 1:** User profile, subjects, dashboard, file system
- ✅ **Phase 2:** AI course creation interview, course structure generation
- ✅ **Phase 3:** AI content generation for all module types
- ✅ **Phase 4:** Learning interface (LessonView, ExerciseView, QuizView, AI tutor)
- 🔜 **Phase 5:** AI tutoring enhancements (streaming, persistence)
- 🔜 **Phase 6:** IDE integration polish, context editor, regeneration

---

## Core Architecture

### 1. Hierarchical Context System

The entire system is built around a four-level hierarchy where each level inherits context from its parent:

```
User (Global preferences, IDE choice, learning style)
└── Subject (e.g., "Embedded Development" - tools, hardware, background)
    └── Course (e.g., "ARM Cortex-M Interrupts" - goals, prerequisites)
        └── Module (Lesson/Exercise/Quiz - specific content)
```

**Key Insight:** When AI interacts with any module, it receives the **merged context from all parent levels**, providing full awareness of the user's background, subject specifics, and course goals.

### 2. Agent Pattern

All AI functionality uses an abstract `Agent` base class with a tool-use loop:

```typescript
abstract class Agent {
  protected abstract getSystemPrompt(context: Partial<HierarchicalContext>): string;
  protected abstract getTools(): Tool[];
  protected abstract executeTool(name: string, input: any, context: any): Promise<any>;

  async run(userInput: string, context: Partial<HierarchicalContext>): Promise<AgentResponse>;
}
```

**How It Works:**
1. Agent receives user input + hierarchical context
2. Calls OpenRouter API with system prompt + tools
3. If AI wants to use a tool, executes it and feeds result back
4. Continues loop until AI returns final text response
5. Returns `AgentResponse` with text, stop reason, and token usage

**Implemented Agents:**
- `InterviewAgent` - Conducts form-based subject/course creation interviews
- `CourseDesignerAgent` - Generates course structure with modules
- `ContentGeneratorAgent` - Creates lesson/exercise/quiz content (maxTokens: 16000)
  - Increased token limit to support complex multi-file exercises
  - System prompt encourages quality over quantity, starter code with TODOs
  - Aware of file browser system for flexible module structures
- `TutorAgent` - Provides conversational tutoring (no tools)

### 3. Data Storage

All data stored as JSON files in filesystem (no database):

**Development:** `~/personal-lesson-agent-data/`
**Production:** `app.getPath('userData')/learning-data/`

**File Structure:**
```
personal-lesson-agent-data/
├── user-context.json                     # Global user profile
└── {subject-id}/                         # kebab-case
    ├── subject-context.json              # Subject metadata
    └── {course-id}/                      # kebab-case
        ├── course-context.json           # Course metadata
        ├── modules.json                  # Array of all modules
        └── {module-id}/                  # kebab-case with type prefix
            ├── module-context.json       # Module metadata
            ├── content.md                # Lesson content (typical for lessons)
            ├── description.md            # Exercise description (typical for exercises)
            ├── questions.json            # Quiz questions (typical for quizzes)
            ├── [any additional files...] # Modules can contain any files
            └── project/                  # Exercise project folder (typical for exercises)
                ├── README.md
                └── [project files...]

Note: With the Module Browser, users can now access ALL files in a module directory,
not just the type-specific primary files. Modules can contain flexible content structures.
```

### 4. IPC Communication

Electron's IPC bridge provides secure file system access from renderer:

**Preload Script:** Exposes safe APIs via `window.electron`
```typescript
window.electron.readFile(path: string) => Promise<string>
window.electron.writeFile(path: string, content: string) => Promise<void>
window.electron.openInIDE(projectPath: string, ide: string) => Promise<any>
```

**Main Process:** Implements actual file operations with proper sandboxing

---

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 5.9** - Type safety (strict mode, verbatimModuleSyntax enabled)
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **React Router 7** - Client-side routing

### Desktop
- **Electron 38** - Desktop application framework
- **Node.js** - Backend runtime

### AI Integration
- **OpenRouter API** - AI API gateway
- **Claude Sonnet 4** - Default model (anthropic/claude-sonnet-4.5)

### Key Libraries
- **lucide-react** - Icon library (NO emojis - strict policy!)
- **react-markdown** - Markdown rendering
- **remark-gfm** - GitHub Flavored Markdown support
- **mermaid** - Diagram rendering in lessons

---

## Key Files Reference

### Core Services

**`src/services/agents/Agent.ts`**
- Abstract base class for all AI agents
- Implements tool-use loop with max 10 iterations
- Methods: `run()`, `getSystemPrompt()`, `getTools()`, `executeTool()`

**`src/services/agents/InterviewAgent.ts`**
- Form-based interview agent for subjects and courses
- Uses `generate_follow_up_questions` tool to create dynamic follow-up forms
- Uses `complete_subject_interview` or `complete_course_interview` to finalize
- Methods: `processAnswers()`, `getFollowUpQuestions()`, `hasFollowUpQuestions()`, `isComplete()`

**`src/services/agents/InitialQuestions.ts`**
- Defines predefined initial questions for subjects and courses
- `SUBJECT_INITIAL_QUESTIONS`: 4 questions about subject, background, tools, goals
- `COURSE_INITIAL_QUESTIONS`: 6 questions about topic, objectives, knowledge level, project ideas, etc.
- Question types: text (short), textarea (long), select (dropdown)

**`src/services/storage/ContextManager.ts`**
- Loads/saves context files at all levels
- Key methods:
  - `loadHierarchicalContext(subjectId?, courseId?, moduleId?)` - Loads merged context
  - `saveContext(level, data, ...)` - Saves at specific level
  - `loadAllSubjects()` - Gets all subjects
  - `loadCourseModules(subjectId, courseId)` - Gets modules list
  - `updateModuleMetadata(subjectId, courseId, moduleId, updates)` - Updates single module

**`src/services/storage/FileSystemService.ts`**
- Wraps IPC calls for file operations
- All paths relative to data directory
- Methods: `readFile()`, `writeFile()`, `readJSON()`, `writeJSON()`, `createDirectory()`, `listDirectory()`, `exists()`

**`src/services/api/openrouter.ts`**
- OpenRouter API client with tool support
- `chatCompletion(messages, systemPrompt, tools?, model?)` - Main API call
- Helper functions for tool extraction and result formatting

### Type Definitions

**`src/types/context.ts`**
```typescript
interface UserContext { name?, preferredIDE, learningStylePreference, createdAt }
interface SubjectContext { subjectName, subjectId, createdAt, [key: string]: any }
interface CourseContext { courseName, courseId, goal, prerequisitesCovered, [key: string]: any }
interface ModuleContext { moduleId, type, title, completed, [key: string]: any }
interface HierarchicalContext { user, subject, course, module }
```

**`src/types/module.ts`**
```typescript
type Module = Lesson | Exercise | Quiz;
interface Lesson { type: 'lesson', contentPath, ... }
interface Exercise { type: 'exercise', descriptionPath, projectPath, ... }
interface Quiz { type: 'quiz', questionsPath, ... }
```

### Key Components

**`src/components/Dashboard/Dashboard.tsx`**
- Main landing page showing all subjects
- Entry point for user journey

**`src/components/CourseCreation/InterviewForm.tsx`**
- Reusable form component for rendering question arrays
- Supports text, textarea, and select input types
- Real-time validation with error messages
- Shows progress indicator (Step X of Y)

**`src/components/CourseCreation/InterviewFormFlow.tsx`**
- Orchestrates multi-step form-based interview
- Flow: initial form → AI follow-ups → completion
- Manages communication with InterviewAgent
- Shows completion state with smooth transitions

**`src/components/SubjectView/SubjectView.tsx`**
- Displays all courses for a subject
- Manages course creation with form-based interview flow
- Integrates InterviewFormFlow with InterviewAgent

**`src/components/ModuleView/ModuleView.tsx`**
- Router component for module display
- Loads module and full hierarchical context
- Routes all module types to ModuleBrowserView (unified interface)

**`src/components/ModuleView/ModuleBrowserView.tsx`**
- Unified 3-panel module viewer with file browser
- Left panel: Resizable, collapsible file tree showing all module files/folders
- Center panel: Smart content viewer (auto-detects file type: markdown, JSON, code, text)
- Right panel: AI Tutor chat (resizable, collapsible)
- Supports viewing any file in module directory, not just primary content
- Special rendering for questions.json files via QuizQuestionsViewer

**`src/components/ModuleView/QuizQuestionsViewer.tsx`**
- Read-only viewer for questions.json files
- Displays quiz questions with answers and explanations in formatted cards
- Used within ModuleBrowserView when viewing quiz question files

**`src/components/ModuleView/AITutorChat.tsx`**
- Reusable chat interface
- Integrates with TutorAgent
- Used in ModuleBrowserView

**`src/components/Shared/MarkdownRenderer.tsx`**
- Renders markdown with GitHub flavored support
- Handles Mermaid diagram initialization and rendering
- Custom styling for code blocks, tables, blockquotes

### Electron Setup

**`electron/main.ts`**
- Main process entry point
- Registers IPC handlers
- Creates browser window

**`electron/ipc/fileSystem.ts`**
- IPC handlers for file operations
- Sandboxes all paths to data directory

**`electron/ipc/ideIntegration.ts`**
- IPC handlers for opening projects in IDEs
- Supports: IntelliJ IDEA, PyCharm, WebStorm, VS Code, CLion, GoLand, Rider
- Falls back to system file browser if IDE not available

---

## Code Conventions

### TypeScript
- **Strict Mode:** Enabled with `verbatimModuleSyntax`
- **Import Types:** Always use `import type { Type }` for type-only imports
- **No `any`:** Avoid whenever possible, use proper types or `unknown`
- **Naming:**
  - Components: PascalCase (e.g., `Dashboard.tsx`)
  - Services: PascalCase (e.g., `FileSystemService.ts`)
  - Types: camelCase files (e.g., `context.ts`)
  - Utilities: camelCase (e.g., `pathHelpers.ts`)

### UI Conventions
- **NO EMOJIS** - This is a strict policy! Use Lucide React icons instead
- **Icon Mappings:**
  - Lesson: `<Book />`
  - Exercise: `<Code />`
  - Quiz: `<ClipboardList />`
  - Complete: `<CheckCircle />`
  - Incomplete: `<Circle />`
  - Add: `<Plus />`
  - Back: `<ChevronLeft />`
  - Navigate: `<ChevronRight />`
  - AI Chat: `<MessageSquare />`
  - Settings: `<Settings />`

### File Naming on Disk
- Subject IDs: kebab-case (e.g., `embedded-development`)
- Course IDs: kebab-case (e.g., `arm-cortex-m-interrupts`)
- Module IDs: kebab-case with type prefix (e.g., `lesson-01-basics`, `exercise-02-hello-world`, `quiz-01-fundamentals`)

---

## Development Workflow

### Running the App
```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Electron
npm run electron:dev
```

### Building
```bash
# Production build
npm run build

# Electron build
npm run electron:build
```

### Environment Variables
Create `.env` in project root:
```
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Access in code:
```typescript
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
```

---

## Common Operations

### Creating a New Agent
1. Extend `Agent` base class
2. Implement `getSystemPrompt(context)` with detailed instructions
3. Implement `getTools()` returning tool definitions
4. Implement `executeTool(name, input, context)` with tool logic
5. Call `this.run(userInput, context)` to execute

Example structure:
```typescript
export class MyAgent extends Agent {
  protected getSystemPrompt(context: Partial<HierarchicalContext>): string {
    return `You are... Context: ${JSON.stringify(context)}`;
  }

  protected getTools(): Tool[] {
    return [{ name: 'my_tool', description: '...', input_schema: {...} }];
  }

  protected async executeTool(name: string, input: any, context: any): Promise<any> {
    if (name === 'my_tool') {
      // Execute tool logic
      return result;
    }
    throw new Error(`Unknown tool: ${name}`);
  }
}
```

### Loading Context
```typescript
const fs = new FileSystemService();
const contextManager = new ContextManager(fs);

// Load full context for a module
const context = await contextManager.loadHierarchicalContext(
  subjectId,
  courseId,
  moduleId
);

// Load just subjects
const subjects = await contextManager.loadAllSubjects();

// Load modules for a course
const modules = await contextManager.loadCourseModules(subjectId, courseId);
```

### Generating Module Content
```typescript
import { generateModuleContent } from '../services/tools/ContentTools';

const result = await generateModuleContent(
  subjectId,
  courseId,
  module,
  context,
  (progress) => {
    console.log(`Progress: ${progress.current}/${progress.total}`);
  }
);
```

### Updating Module Status
```typescript
// Mark module complete
await contextManager.updateModuleMetadata(
  subjectId,
  courseId,
  moduleId,
  { completed: true }
);

// Add content path to lesson
await contextManager.updateModuleMetadata(
  subjectId,
  courseId,
  moduleId,
  { contentPath: 'lesson-01/content.md' }
);
```

---

## Navigation Flow

```
Dashboard (/)
  ↓ Click subject
SubjectView (/subject/:subjectId)
  ↓ Click course
CourseView (/subject/:subjectId/course/:courseId)
  ↓ Click module
ModuleView (/subject/:subjectId/course/:courseId/module/:moduleId)
  ↓ Renders:
    - ModuleBrowserView (unified file browser for all module types)
```

ModuleBrowserView features:
- Back navigation to course
- 3-panel layout: file tree (left) + content viewer (center) + AI tutor (right)
- Resizable and collapsible sidebars
- Smart content rendering based on file type
- Mark complete button
- Loading and error states

## Important Implementation Details

### Mermaid Diagram Rendering
```typescript
// Initialize once
useEffect(() => {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
  });
}, []);

// Re-render on content change
useEffect(() => {
  if (containerRef.current) {
    const elements = containerRef.current.querySelectorAll('.mermaid');
    elements.forEach((el, i) => {
      el.setAttribute('data-processed', 'false');
      el.id = `mermaid-${Date.now()}-${i}`;
    });
    mermaid.run({ querySelector: '.mermaid' });
  }
}, [content]);
```

### Tool-Use Loop Pattern
1. Send user message + system prompt + tools to API
2. Receive response with `stop_reason`
3. If `end_turn`: Return final text response
4. If `tool_use`: Extract tool calls, execute them, add results as user message, loop back to step 1
5. If `max_tokens`: Return partial response
6. Max 10 iterations to prevent infinite loops

### Context Enrichment for Tutor
```typescript
// Add module content to context before passing to tutor
const enrichedContext = {
  ...context,
  module: {
    ...context.module,
    content: moduleContent, // The actual lesson/exercise/quiz content
  },
};

const response = await tutorAgent.run(userMessage, enrichedContext);
```

---

## Known Limitations & Future Work

### Current Limitations (By Design)
- No streaming AI responses for forms or tutor (shows after completion)
- Quiz validation is string comparison only (no code execution)
- No module regeneration from UI (must delete files manually)
- File tree uses generic File/Folder icons (no file type specific icons)
- No syntax highlighting for code files in browser (monospace only)
- No keyboard navigation between modules (Next/Previous buttons)
- No search/filter in module file tree

### Phase 5 Enhancements (Future)
- Streaming AI responses for real-time chat
- More sophisticated context awareness
- Proactive hints based on user behavior
- Code execution for programming exercises
- Personalized learning path adjustments

### Phase 6 IDE & Polish (Future)
- Enhanced IDE launcher with auto-detection
- In-app file editing (file browser provides viewing, editing would be next step)
- Syntax highlighting for code files
- File type specific icons in tree
- Search/filter in module file tree
- Context editor UI
- Module regeneration from UI
- Keyboard navigation shortcuts
- Additional UI polish and refinements

---

## Troubleshooting

### Build Errors
- **"verbatimModuleSyntax" errors:** Use `import type { Type }` for type-only imports
- **Module not found:** Check import paths are correct and files exist
- **IPC errors:** Ensure Electron IPC handlers are registered in `main.ts`

### Runtime Errors
- **"Module not found" in runtime:** Check data directory structure and file paths
- **Context loading fails:** Validate JSON files are well-formed
- **AI errors:** Check API key is set in `.env` and OpenRouter has credits

### Data Issues
- **Lost data:** Check `~/personal-lesson-agent-data/` directory exists
- **Corrupt JSON:** Manually fix or regenerate from UI
- **Missing modules:** Check `modules.json` file in course directory

---

## Quick Reference

### Data Paths
```typescript
User:    ~/personal-lesson-agent-data/user-context.json
Subject: ~/personal-lesson-agent-data/{subject-id}/subject-context.json
Course:  ~/personal-lesson-agent-data/{subject-id}/{course-id}/course-context.json
Modules: ~/personal-lesson-agent-data/{subject-id}/{course-id}/modules.json
Module:  ~/personal-lesson-agent-data/{subject-id}/{course-id}/{module-id}/module-context.json
```

### API Models
```typescript
DEFAULT_MODEL = 'anthropic/claude-sonnet-4.5'
// Can override per agent in constructor
```

### Key Components to Modify for Common Tasks
- **Add new module type:** Update `src/types/module.ts` + create new view component
- **Change AI behavior:** Modify system prompts in agent classes
- **Add new tool:** Define in agent's `getTools()` + implement in `executeTool()`
- **Modify UI theme:** Edit Tailwind classes in component files
- **Add new route:** Update `src/App.tsx` routes

---

## Summary

This is a **well-architected, fully-functional educational platform** where AI does the heavy lifting of content creation and tutoring. The hierarchical context system ensures AI always has full awareness of the learner's background and goals. The agent pattern provides a clean abstraction for all AI interactions. File-based storage keeps things simple and inspectable.

**Key Success:** Phases 1-4 are complete and working. Users can create subjects, have AI generate entire courses, and learn with an AI tutor by their side. The Module Browser System provides a flexible, unified interface for viewing all module content with resizable panels and smart file type detection.

**Recent Enhancement:** The Module Browser System (October 2025) replaced type-specific views with a unified file browser, enabling flexible module structures and better content discovery. The AI content generation system now produces higher-quality exercises with increased token limits and better guidance.

**Current State:** Production-ready for core learning workflow. Polish and advanced features coming in Phases 5-6.

---
