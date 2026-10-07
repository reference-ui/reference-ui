import { defineConfig } from 'tsup'

const external = [
  '@reference-ui/react',
  /^@reference-ui\/styled(\/.*)?$/,
  // The generated types bundle lazy-imports its tasty runtime relative to
  // dist/index.mjs; keep the edge external so esbuild does not eagerly inline
  // the 550-chunk runtime, and the materialized dist/tasty/ payload resolves
  // it at runtime (the lazy chunk graph ships beside index.mjs).
  './tasty/runtime.js',
  'react',
  'react-dom',
]

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'theme/index': 'src/core/theme/index.ts',
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
  external,
  noExternal: ['gsap'],
})
