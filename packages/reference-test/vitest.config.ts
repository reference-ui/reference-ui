import { defineConfig } from 'vitest/config'
import { MATRIX } from './src/environments/matrix.js'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60_000,
    disableConsoleIntercept: true,
    setupFiles: ['src/setup.ts'],
    projects: MATRIX.map((entry) => ({
      extends: true,
      test: {
        name: entry.name,
        setupFiles: [`src/environments/setup.${entry.name}.ts`],
        include: ['src/tests/**/*.test.ts'],
      },
    })),
  },
})
