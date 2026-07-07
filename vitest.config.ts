import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./vitest.setup.ts'],
      // Tests never call the real API (MSW intercepts fetch), but the
      // OpenRouter client requires a key to be present
      env: {
        VITE_OPENROUTER_API_KEY: 'test-api-key',
      },
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', 'dist-electron', 'release'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'dist/',
          'dist-electron/',
          'release/',
          'src/**/*.d.ts',
          'src/types/',
          '**/*.config.ts',
          '**/vitest.setup.ts',
        ],
      },
    },
  })
);
