/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
    include: ['__tests__/**/*.spec.tsx'],
    testTimeout: 10000, // Increase timeout for tests with fake timers
  },
  resolve: {
    alias: {
      'jotai-tanstack-query': new URL('./src/index.ts', import.meta.url)
        .pathname,
    },
  },
})
