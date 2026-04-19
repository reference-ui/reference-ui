import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'js/runtime/index.ts',
    tasty: 'js/tasty/index.ts',
    'tasty/browser': 'js/tasty/browser.ts',
    'tasty/build': 'js/tasty/build.ts',
    atlas: 'js/atlas/index.ts',
    styletrace: 'js/styletrace/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  target: 'node18',
  outDir: 'dist',
  outExtension() {
    return { js: '.mjs' }
  },
})
