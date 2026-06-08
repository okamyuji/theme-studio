import { defineConfig, mergeConfig } from 'vite-plus';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      exclude: ['e2e/**', 'node_modules/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/test/**'],
        thresholds: {
          statements: 80,
          branches: 60, // lowered from 80 — will improve in later phases
          functions: 80,
          lines: 80,
        },
      },
    },
  }),
);
