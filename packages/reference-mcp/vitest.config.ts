// Vitest alias wiring for the Core specifier set (mirrors tsconfig paths).
// It takes the virtual `@reference-ui/core/*` ids and emits Core source files.
// scripts/build-bundle.mjs carries the same map; no core package.json exports entries.

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = dirname(fileURLToPath(import.meta.url))
const core = (p: string) => resolve(root, '../reference-core/src', p)

export default defineConfig({
  resolve: {
    alias: {
      '@reference-ui/core/config/store': core('config/store.ts'),
      '@reference-ui/core/config/errors': core('config/errors.ts'),
      '@reference-ui/core/config/evaluate': core('config/evaluate.ts'),
      '@reference-ui/core/config/validate': core('config/validate.ts'),
      '@reference-ui/core/config/constants': core('config/constants.ts'),
      '@reference-ui/core/config/types': core('config/types.ts'),
      '@reference-ui/core/reference': core('reference/api.ts'),
      '@reference-ui/core/fragments/runner': core('collect/lib/runner.ts'),
      '@reference-ui/core/fragments/scanner': core('collect/lib/scan/scanner.ts'),
      '@reference-ui/core/fragments/tokens': core('collect/surface/tokens.ts'),
      '@reference-ui/core/system/base/fragments': core('system/base/fragments.ts'),
      '@reference-ui/core/microbundle': core('lib/microbundle/index.ts'),
      '@reference-ui/core/style-vocabulary': core('native/style-vocabulary.ts'),
    },
  },
})
