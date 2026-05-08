import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  external: [
    'react',
    'react/jsx-runtime',
    '@reference-ui/react',
    '@reference-ui/react/*',
    '@reference-ui/system',
    '@reference-ui/system/*',
    '@fixtures/extend-library',
  ],
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
