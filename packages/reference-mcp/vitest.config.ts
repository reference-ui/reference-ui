// Vitest alias wiring for the F1 Neo specifier set (mirrors tsconfig paths).
// It takes the virtual `@reference-ui/neo/*` ids and emits Neo source files.
// tsup carries the same map for builds; no neo package.json exports entries.

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = dirname(fileURLToPath(import.meta.url))
const neo = (p: string) => resolve(root, '../reference-neo/src', p)

export default defineConfig({
  resolve: {
    alias: {
      '@reference-ui/neo/config/store': neo('config/store.ts'),
      '@reference-ui/neo/config/errors': neo('config/errors.ts'),
      '@reference-ui/neo/config/evaluate': neo('config/evaluate.ts'),
      '@reference-ui/neo/config/validate': neo('config/validate.ts'),
      '@reference-ui/neo/config/constants': neo('config/constants.ts'),
      '@reference-ui/neo/config/types': neo('config/types.ts'),
      '@reference-ui/neo/reference': neo('reference/api.ts'),
      '@reference-ui/neo/fragments/runner': neo('collect/lib/runner.ts'),
      '@reference-ui/neo/fragments/scanner': neo('collect/lib/scan/scanner.ts'),
      '@reference-ui/neo/fragments/tokens': neo('collect/surface/tokens.ts'),
      '@reference-ui/neo/microbundle': neo('lib/microbundle/index.ts'),
    },
  },
})
