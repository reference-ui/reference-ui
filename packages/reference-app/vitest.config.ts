import { defineConfig } from 'vitest/config'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    passWithNoTests: true,
    hookTimeout: 60_000,
    globalSetup: resolve(__dirname, 'tests/setup/global-setup.ts'),
    setupFiles: [resolve(__dirname, 'tests/setup/dom-matchers.ts')],
  },
})
