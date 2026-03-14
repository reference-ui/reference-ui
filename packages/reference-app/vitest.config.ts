import { defineConfig } from 'vitest/config'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** Core package built styled output (from prebuild). Lets primitives tests load @reference-ui/react without requiring app ref sync. */
const coreStyledDir = resolve(__dirname, '../reference-core/src/system/styled')

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@reference-ui\/styled\/(.*)$/, replacement: join(coreStyledDir, '$1') },
      { find: '@reference-ui/styled', replacement: coreStyledDir },
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['tests/system/sync-readiness.test.ts'],
    passWithNoTests: true,
    hookTimeout: 60_000,
    globalSetup: resolve(__dirname, 'tests/setup/global-setup.ts'),
    setupFiles: [resolve(__dirname, 'tests/setup/dom-matchers.ts')],
  },
})
