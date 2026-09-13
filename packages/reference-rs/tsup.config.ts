/**
 * Configuration module for bundling the TypeScript and JavaScript entrypoints of reference-rs.
 * Takes the source modules for runtime, tasty, atlas, styletrace, and system subpaths.
 * Emits clean, standalone ECMAScript modules in the dist directory with .mjs file extensions.
 * Targets modern Node 18 runtime environments without generating inline source maps.
 */
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'js/runtime/index.ts',
    tasty: 'js/tasty/index.ts',
    'tasty/browser': 'js/tasty/browser.ts',
    'tasty/build': 'js/tasty/build.ts',
    atlas: 'js/atlas/index.ts',
    styletrace: 'js/styletrace/index.ts',
    system: 'js/system/index.ts',
  },
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  target: 'node18',
  outDir: 'dist',
  outExtension() {
    return { js: '.mjs' }
  },
})
