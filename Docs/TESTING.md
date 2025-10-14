# Testing Guide

This document provides comprehensive guidance on testing in the Personal Lesson Agent project.

## Table of Contents
- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Organization](#test-organization)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses **Vitest** as the primary testing framework, along with React Testing Library for component tests and MSW (Mock Service Worker) for API mocking.

### Why Vitest?

- **Native Vite integration** - No complex configuration needed
- **10x faster than Jest** - Optimized for Vite's dev server
- **Jest-compatible API** - Familiar syntax and assertions
- **Built-in TypeScript support** - Works seamlessly with our setup
- **Better ES modules support** - Handles modern imports naturally

## Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner and assertion library |
| **React Testing Library** | Component testing utilities |
| **@testing-library/user-event** | Realistic user interaction simulation |
| **happy-dom** | Fast DOM environment for tests |
| **MSW (Mock Service Worker)** | API mocking |

## Running Tests

### Basic Commands

```bash
# Run all tests (watch mode)
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Watch Mode

The default `npm test` runs in watch mode, which:
- Automatically reruns tests when files change
- Provides an interactive CLI for filtering tests
- Leverages Vite's HMR for instant feedback

### UI Mode

Run `npm run test:ui` to open Vitest's interactive UI in your browser. This provides:
- Visual test results
- Test file explorer
- Real-time updates
- Detailed error messages

### Coverage Reports

Run `npm run test:coverage` to generate coverage reports in:
- **Text format** - Printed to console
- **HTML format** - Open `coverage/index.html` in browser
- **JSON format** - For CI/CD integration

## Writing Tests

### File Naming Convention

Test files should be named with `.test.ts` or `.test.tsx` extension:

```
src/
├── services/
│   ├── agents/
│   │   ├── Agent.ts
│   │   └── Agent.test.ts          # Unit test
│   └── storage/
│       ├── ContextManager.ts
│       └── ContextManager.test.ts # Unit test
└── components/
    └── Dashboard/
        ├── Dashboard.tsx
        └── Dashboard.test.tsx     # Component test
```

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyComponent or MyFunction', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('specific feature', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## Test Organization

### Test Fixtures

Reusable test data is stored in `src/__tests__/fixtures/`:

```typescript
// src/__tests__/fixtures/context-fixtures.ts
import type { UserContext } from '../../types/context';

export const mockUserContext: UserContext = {
  name: 'Test User',
  preferredIDE: 'vscode',
  learningStylePreference: 'hands-on',
  createdAt: '2025-01-01T00:00:00.000Z',
};
```

**Usage:**

```typescript
import { mockUserContext } from '../../__tests__/fixtures/context-fixtures';

it('should use user context', () => {
  const result = processUser(mockUserContext);
  expect(result).toBeDefined();
});
```

### Test Utilities

Helper functions are stored in `src/__tests__/utils/`:

```typescript
// src/__tests__/utils/test-utils.tsx
export function renderWithRouter(ui: ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
  });
}

export function createMockFileSystemService() {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    // ... other methods
  };
}
```

**Usage:**

```typescript
import { renderWithRouter } from '../../__tests__/utils/test-utils';

it('should render with routing', () => {
  renderWithRouter(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### MSW Handlers

API mocking handlers are in `src/__tests__/setup/msw-handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('https://openrouter.ai/api/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [{ message: { content: 'Mocked response' } }],
    });
  }),
];
```

## Best Practices

### 1. Test Behavior, Not Implementation

**Good:**
```typescript
it('should display error message when login fails', async () => {
  render(<LoginForm />);
  await userEvent.click(screen.getByRole('button', { name: /login/i }));
  expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
});
```

**Bad:**
```typescript
it('should call setError when login fails', async () => {
  const setError = vi.fn();
  render(<LoginForm setError={setError} />);
  // Testing implementation detail
});
```

### 2. Use Testing Library Queries Appropriately

**Priority order:**
1. `getByRole` - Accessibility-first
2. `getByLabelText` - Form elements
3. `getByPlaceholderText` - Inputs
4. `getByText` - Non-interactive text
5. `getByTestId` - Last resort

```typescript
// Good
const button = screen.getByRole('button', { name: /submit/i });

// Avoid if possible
const button = screen.getByTestId('submit-button');
```

### 3. Mock External Dependencies

Always mock:
- File system operations
- API calls
- Electron IPC
- Browser APIs

```typescript
// Mock Electron API
beforeEach(() => {
  mockElectronAPI();
});

// Mock file system
vi.mock('../../services/storage/FileSystemService', () => ({
  fileSystemService: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));
```

### 4. Clean Up After Tests

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup(); // Cleanup DOM
  vi.clearAllMocks(); // Reset mocks
});
```

### 5. Test Edge Cases

Don't just test the happy path:

```typescript
describe('loadUserContext', () => {
  it('should load user context when file exists', async () => {
    // Happy path
  });

  it('should return null when file does not exist', async () => {
    // Edge case
  });

  it('should handle read errors gracefully', async () => {
    // Error case
  });
});
```

## Common Patterns

### Testing Async Operations

```typescript
it('should load data asynchronously', async () => {
  mockFS.readFile.mockResolvedValue('data');

  render(<MyComponent />);

  await waitFor(() => {
    expect(screen.getByText('data')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event';

it('should submit form on button click', async () => {
  const user = userEvent.setup();
  render(<Form />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### Testing Agent Classes

```typescript
import { Agent } from './Agent';

class TestAgent extends Agent {
  protected getSystemPrompt() {
    return 'Test prompt';
  }

  protected getTools() {
    return [];
  }

  protected async executeTool() {
    return 'result';
  }
}

describe('Agent', () => {
  it('should execute run method', async () => {
    const agent = new TestAgent();
    const result = await agent.run('input', context);
    expect(result).toBeDefined();
  });
});
```

### Mocking API Calls with MSW

```typescript
import { setupServer } from 'msw/node';
import { handlers } from '../../__tests__/setup/msw-handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('should fetch data from API', async () => {
  const result = await chatCompletion(messages, prompt);
  expect(result.content).toBeDefined();
});
```

### Testing Context Manager

```typescript
it('should load hierarchical context', async () => {
  mockFS.exists.mockResolvedValue(true);
  mockFS.readJSON
    .mockResolvedValueOnce(mockUserContext)
    .mockResolvedValueOnce(mockSubjectContext);

  const context = await contextManager.loadHierarchicalContext('subject-id');

  expect(context.user).toEqual(mockUserContext);
  expect(context.subject).toEqual(mockSubjectContext);
});
```

## Troubleshooting

### Tests Not Running

**Problem:** Vitest doesn't find tests

**Solution:** Ensure test files match the pattern in `vitest.config.ts`:
```typescript
include: ['src/**/*.{test,spec}.{ts,tsx}']
```

### Module Import Errors

**Problem:** `Cannot find module` errors

**Solution:** Check TypeScript paths and ensure imports use correct syntax:
```typescript
// Use type-only imports where appropriate
import type { MyType } from './types';
```

### Mock Not Working

**Problem:** Mock functions aren't being called

**Solution:** Ensure mocks are set up before the component renders:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  mockFn.mockResolvedValue('value');
});

it('should use mock', () => {
  render(<Component />); // Now mockFn is properly configured
});
```

### Async Test Timeout

**Problem:** Tests timeout waiting for async operations

**Solution:** Use `waitFor` with appropriate timeout:
```typescript
await waitFor(
  () => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  },
  { timeout: 5000 }
);
```

### Coverage Not Generated

**Problem:** `npm run test:coverage` fails

**Solution:** Install coverage provider:
```bash
npm install --save-dev @vitest/coverage-v8
```

Update `vitest.config.ts`:
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
}
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [Vitest UI](https://vitest.dev/guide/ui.html)

## Test Coverage Goals

- **Unit Tests:** Services, utilities, agents - aim for 80%+ coverage
- **Component Tests:** Critical user flows - aim for 60%+ coverage
- **Integration Tests:** Agent tool-use loops - aim for 70%+ coverage

Run `npm run test:coverage` regularly to track progress.

---

**Need Help?** If you encounter issues not covered here, check the project's GitHub issues or create a new one.
