import { defineConfig } from 'tsup'

const external = [
  '@reference-ui/react',
  '@reference-ui/icons',
  /^@reference-ui\/styled(\/.*)?$/,
  '@material-symbols-svg/react',
  'react',
  'react-dom',
]

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'theme/index': 'src/core/theme/index.ts',
    'icons/index': 'src/icons/index.ts',
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
