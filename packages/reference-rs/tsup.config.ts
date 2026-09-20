/**
 * Configuration module for bundling the TypeScript and JavaScript entrypoints of reference-rs.
 * Takes the source modules for runtime, tasty, atlas, styletrace, atomic, and namer subpaths.
 * Emits clean, standalone ECMAScript modules in the dist directory with .mjs file extensions.
 * Selectively purges stale JavaScript outputs while preserving native, cargo, and npm trees.
 * Targets modern Node 18 runtime environments without generating inline source maps.
 */
import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'tsup'

const PRESERVED_DIST_DIRS = new Set(['cargo', 'native', 'npm', 'artifacts'])

function cleanStaleJsOutputs(distDir: string): void {
  if (!existsSync(distDir)) return

  for (const entry of readdirSync(distDir, { withFileTypes: true })) {
    if (PRESERVED_DIST_DIRS.has(entry.name)) continue
    rmSync(join(distDir, entry.name), { recursive: true, force: true })
  }
}

cleanStaleJsOutputs('dist')

export default defineConfig({
  entry: {
    index: 'modules/runtime/js/index.ts',
    tasty: 'modules/tasty/js/index.ts',
    'tasty/browser': 'modules/tasty/js/browser.ts',
    'tasty/build': 'modules/tasty/js/build.ts',
    atlas: 'modules/atlas/js/index.ts',
    styletrace: 'modules/styletrace/js/index.ts',
    atomic: 'modules/atomic/js/index.ts',
    namer: 'modules/atomic/js/namer/index.ts',
    system: 'modules/atomic/js/index.ts',
    typegen: 'modules/typegen/js/index.ts',
  },
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: false,
  target: 'node18',
  outDir: 'dist',
  outExtension() {
    return { js: '.mjs' }
  },
})
