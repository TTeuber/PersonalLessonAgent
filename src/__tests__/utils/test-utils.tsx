import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type {ReactElement} from 'react';
import { vi } from 'vitest';

// Custom render function that includes providers
export function renderWithRouter(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    ...options,
  });
}

// Mock FileSystemService
export function createMockFileSystemService() {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readJSON: vi.fn(),
    writeJSON: vi.fn(),
    createDirectory: vi.fn(),
    listDirectory: vi.fn(),
    exists: vi.fn(),
  };
}

// Mock ContextManager
export function createMockContextManager() {
  return {
    loadUserContext: vi.fn(),
    saveUserContext: vi.fn(),
    loadSubjectContext: vi.fn(),
    saveSubjectContext: vi.fn(),
    loadCourseContext: vi.fn(),
    saveCourseContext: vi.fn(),
    loadModuleContext: vi.fn(),
    saveModuleContext: vi.fn(),
    loadHierarchicalContext: vi.fn(),
    loadAllSubjects: vi.fn(),
    loadSubjectCourses: vi.fn(),
    loadCourseModules: vi.fn(),
    updateModuleMetadata: vi.fn(),
  };
}

// Mock window.electron
export function mockElectronAPI() {
  // Check if electron is already defined (from vitest.setup.ts)
  if (window.electron) {
    return window.electron;
  }

  const electron = {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readJSON: vi.fn(),
    writeJSON: vi.fn(),
    createDirectory: vi.fn(),
    listDirectory: vi.fn(),
    exists: vi.fn(),
    openInIDE: vi.fn(),
  };

  Object.defineProperty(window, 'electron', {
    value: electron,
    writable: true,
    configurable: true,
  });

  return electron;
}

// Wait for async operations
export async function waitForAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Create a spy that resolves with a value
export function createResolvedSpy<T>(value: T) {
  return vi.fn().mockResolvedValue(value);
}

// Create a spy that rejects with an error
export function createRejectedSpy(error: Error) {
  return vi.fn().mockRejectedValue(error);
}

// Mock API response helper
export function createMockAPIResponse(content: string, stopReason = 'end_turn') {
  return {
    id: 'test-response-id',
    model: 'anthropic/claude-sonnet-4.6',
    choices: [
      {
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: stopReason,
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    },
  };
}
