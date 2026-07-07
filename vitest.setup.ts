import '@testing-library/jest-dom/vitest';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Electron APIs globally
beforeAll(() => {
  // Mock window.electron for tests
  global.window = Object.create(window);
  Object.defineProperty(window, 'electron', {
    value: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      readJSON: vi.fn(),
      writeJSON: vi.fn(),
      createDirectory: vi.fn(),
      listDirectory: vi.fn(),
      exists: vi.fn(),
      openInIDE: vi.fn(),
    },
    writable: true,
  });
});

// Setup MSW
beforeAll(() => {
  // MSW handlers will be initialized in individual test files
});

afterAll(() => {
  // Cleanup MSW
});
