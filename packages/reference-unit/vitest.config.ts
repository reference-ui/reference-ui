import { defineConfig } from 'vitest/config'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const includeWatchTests = process.env.REF_UNIT_INCLUDE_WATCH_TESTS === '1'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: includeWatchTests
      ? ['tests/**/.reference-ui/**', 'tests/**/node_modules/**']
      : [
          'tests/watch/**/*.test.ts',
          'tests/**/.reference-ui/**',
          'tests/**/node_modules/**',
        ],
    passWithNoTests: true,
    hookTimeout: 60_000,
    globalSetup: resolve(__dirname, 'tests/setup/global-setup.ts'),
    setupFiles: [resolve(__dirname, 'tests/setup/dom-matchers.ts')],
  },
})
