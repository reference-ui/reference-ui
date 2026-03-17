import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'js/runtime/index.ts',
    tasty: 'js/tasty/index.ts',
    'tasty/build': 'js/tasty/build.ts',
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
