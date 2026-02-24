import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/cli/index.ts',
    'watch/worker': 'src/cli/watch/worker.ts',
    'virtual/worker': 'src/cli/virtual/worker.ts',
    'system/worker': 'src/cli/system/worker.ts',
    'packager/worker': 'src/cli/packager/worker.ts',
    'packager-ts/worker': 'src/cli/packager-ts/worker.ts',
  },
  format: 'esm',
  outDir: 'dist/cli',
  platform: 'node',
  target: 'node18',
  splitting: false,
  sourcemap: true,
  clean: true,
  outExtension() {
    return { js: '.mjs' }
  },
  external: [
    'esbuild',
    'fast-glob',
    '@parcel/watcher',
    'typescript',
    'commander',
    'picocolors',
    'picomatch',
    'piscina',
  ],
})
