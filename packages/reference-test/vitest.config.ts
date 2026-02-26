import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    testTimeout: 60_000,
    disableConsoleIntercept: true,
    setupFiles: ['src/setup.ts'],
  },
})
