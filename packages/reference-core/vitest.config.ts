import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const coreDir = dirname(fileURLToPath(import.meta.url))
const rustPackageRoot = resolve(coreDir, '../reference-rs')

/**
 * Vitest resolves workspace packages through Vite; without aliases, `@reference-ui/rust/tasty`
 * can become an invalid `/@fs/...` URL at runtime. Point at the built JS explicitly.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@reference-ui/rust/tasty': resolve(rustPackageRoot, 'dist/tasty.mjs'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
})
