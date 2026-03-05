import { defineConfig } from 'vitest/config'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** CLI's built styled output (from prebuild). Lets primitives tests load @reference-ui/react without requiring app ref sync. */
const cliStyledDir = resolve(__dirname, '../reference-cli/src/system/styled')

export default defineConfig({
  resolve: {
    alias: {
      '@reference-ui/styled': cliStyledDir,
      '@reference-ui/styled/*': join(cliStyledDir, '*'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    passWithNoTests: true,
    globalSetup: resolve(__dirname, 'tests/setup/global-setup.ts'),
    setupFiles: [resolve(__dirname, 'tests/setup/dom-matchers.ts')],
  },
})
