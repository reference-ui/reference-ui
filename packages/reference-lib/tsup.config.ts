import { defineConfig } from 'tsup'

const external = [
  '@reference-ui/react',
  /^@reference-ui\/styled(\/.*)?$/,
  'react',
  'react-dom',
]

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'theme/index': 'src/core/theme/index.ts',
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
  external,
})
