# Personal Lesson Agent

[![CI](https://github.com/TTeuber/PersonalLessonAgent/actions/workflows/ci.yml/badge.svg)](https://github.com/TTeuber/PersonalLessonAgent/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> An AI-powered desktop learning platform that designs personalized courses, generates all educational content, and tutors you side-by-side as you learn.

## Screenshots

**Learning in the module browser** — file tree, AI-generated lesson content, and the context-aware AI tutor side by side:

![Module browser with AI tutor](docs/screenshots/module-browser.png)

**Creating a subject** — a guided interview that captures your background and goals so the AI can personalize everything downstream:

![Subject creation interview](docs/screenshots/interview.png)

**A generated course** — AI-designed module sequence with one-click content generation for lessons, exercises, and quizzes:

![Course view with generated modules](docs/screenshots/course-view.png)


Built with **React 19**, **TypeScript**, and **Electron**, the Personal Lesson Agent turns a short interview into a complete, structured course — lessons, hands-on exercises, and quizzes — all authored by AI that understands your background, your tools, and your goals. A context-aware tutor sits beside every module to answer questions in real time.

This project showcases applied **agentic AI engineering**: a custom multi-agent system built on a tool-use loop, a hierarchical context model that gives every AI interaction full awareness of the learner, and a clean separation between AI orchestration, storage, and UI.

---

## Why This Project

I built this to explore a hard, interesting problem: **how do you make an AI tutor that actually knows who it's teaching?** Generic chatbots forget your background the moment the conversation scrolls away. The Personal Lesson Agent solves this with a four-level hierarchical context system, so the AI always reasons with the full picture — from your preferred IDE down to the specific learning objective of the current exercise.

The result is a production-grade desktop app where AI does the heavy lifting of curriculum design and content authoring, while the architecture stays clean, typed, and inspectable.

---

## AI Integration — The Core of the Project

### Multi-Agent Architecture

Every AI capability is implemented as a specialized **agent** extending a shared abstract base class. Each agent defines its own system prompt, tool set, and tool-execution logic, while inheriting a robust tool-use loop.

| Agent | Responsibility |
|-------|----------------|
| **InterviewAgent** | Conducts a dynamic, form-based interview to scope a new subject or course, generating intelligent follow-up questions on the fly |
| **CourseDesignerAgent** | Designs a complete course structure — modules, sequencing, and learning objectives |
| **ContentGeneratorAgent** | Authors full lesson content, multi-file coding exercises with starter scaffolding, and quizzes (16K token budget for rich, multi-file output) |
| **TutorAgent** | Provides conversational, context-aware tutoring within any module |

### The Tool-Use Loop

The heart of the system is an agentic loop that lets the model call tools, receive results, and reason iteratively until it produces a final answer:

```typescript
abstract class Agent {
  protected abstract getSystemPrompt(context: Partial<HierarchicalContext>): string;
  protected abstract getTools(): Tool[];
  protected abstract executeTool(name, input, context): Promise<...>;

  async run(userInput, context): Promise<AgentResponse> {
    // 1. Send user input + system prompt + tools to the model
    // 2. If stop_reason is 'tool_use' → execute tools, feed results back, loop
    // 3. If stop_reason is 'end_turn' → return final text + token usage
    // 4. Bounded to 10 iterations to guarantee termination
  }
}
```

This pattern means adding a new AI capability is as simple as subclassing `Agent` and declaring a system prompt, tools, and an executor — the orchestration, message threading, and tool plumbing come for free.

### Hierarchical Context — AI That Knows the Learner

The defining design decision. Context flows through four inheriting levels:

```
User      → global preferences, IDE choice, learning style
 └── Subject   → domain, tools, hardware, prior background
      └── Course    → goals, prerequisites
           └── Module    → the specific lesson / exercise / quiz
```

When any agent runs, it receives the **merged context from all parent levels**. The course designer knows you're an embedded engineer who prefers CLion; the tutor knows the exact lesson you're stuck on *and* your overall goals. This is what makes the personalization feel genuinely intelligent rather than scripted.

### Model & API

- **OpenRouter API** gateway with a custom typed client (tool-calling, token accounting)
- Default model: **Claude Sonnet 4.6** (`anthropic/claude-sonnet-4.6`), overridable per agent
- Custom translation layer between the app's content-block message format and OpenRouter's OpenAI-style tool-calling schema

---

## Key Features

- **AI course creation interview** — a guided, form-based flow that adapts its questions based on your answers
- **End-to-end content generation** — complete lessons, runnable multi-file exercises, and quizzes, all AI-authored
- **Side-by-side AI tutor** — a context-aware chat panel available in every module
- **Unified module browser** — a 3-panel IDE-like interface (file tree · smart content viewer · AI tutor) with resizable, collapsible panels and automatic file-type detection (Markdown, JSON, code)
- **Rich content rendering** — GitHub-flavored Markdown plus live **Mermaid diagram** rendering inside lessons
- **IDE integration** — open exercise projects directly in IntelliJ, PyCharm, WebStorm, VS Code, CLion, GoLand, or Rider
- **Progress tracking** — module completion state across the full course hierarchy

---

## Tech Stack

**Frontend** · React 19 · TypeScript 5.9 (strict, `verbatimModuleSyntax`) · Vite 7 · Tailwind CSS 4 · React Router 7

**Desktop** · Electron 38 · secure IPC bridge with sandboxed file-system access

**AI** · OpenRouter API · Claude Sonnet 4.6 · custom agent framework with tool-use loop

**Content** · react-markdown · remark-gfm · Mermaid · lucide-react icons

**Testing** · Vitest · Testing Library · MSW · happy-dom

---

## Architecture Highlights

- **Clean separation of concerns** — AI agents (`src/services/agents`), storage (`src/services/storage`), API client (`src/services/api`), and React UI are fully decoupled
- **Type-safe throughout** — discriminated unions for module types (`Lesson | Exercise | Quiz`), strict TypeScript with no implicit `any`
- **File-based storage** — all data persists as inspectable JSON/Markdown on disk; no database required, easy to debug and version
- **Secure Electron IPC** — the renderer never touches the file system directly; all operations route through sandboxed, path-validated handlers in the main process

```
src/
├── services/
│   ├── agents/      # InterviewAgent, CourseDesignerAgent, ContentGeneratorAgent, TutorAgent
│   ├── api/         # OpenRouter client + model config
│   └── storage/     # ContextManager, FileSystemService
├── components/      # Dashboard, CourseCreation, SubjectView, ModuleView, Shared
├── types/           # context.ts, module.ts, agent.ts
└── ...
electron/
├── main.ts          # Main process, window + IPC registration
└── ipc/             # Sandboxed file system + IDE integration handlers
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- An [OpenRouter](https://openrouter.ai/) API key

### Setup

```bash
# Install dependencies
npm install

# Add your API key
echo "VITE_OPENROUTER_API_KEY=your_key_here" > .env
```

### Run (development)

```bash
# Terminal 1 — Vite dev server
npm run dev

# Terminal 2 — Electron
npm run electron:dev
```

### Build

```bash
npm run build           # Production web build
npm run electron:build  # Packaged desktop app
```

### Test

```bash
npm run test            # Watch mode
npm run test:run        # Single run
npm run test:coverage   # With coverage
```

---

## What This Project Demonstrates

- Designing and implementing a **multi-agent AI system** with a reusable tool-use loop abstraction
- Architecting a **hierarchical context model** that makes LLM output feel deeply personalized
- Building a **cross-platform desktop app** with Electron, including a secure IPC layer
- Integrating LLM tool-calling against a real API with proper message-format translation and token accounting
- Writing **strict, maintainable TypeScript** across a non-trivial React + Electron codebase

---

## Roadmap

- Streaming AI responses for real-time tutoring and content generation
- In-app code execution for programming exercises
- Module regeneration and a context editor from the UI
- Syntax highlighting and file-type icons in the module browser

---

*Built as a portfolio project to demonstrate applied AI engineering, agentic system design, and full-stack TypeScript development.*
