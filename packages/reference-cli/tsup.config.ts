import { defineConfig } from 'tsup'
import { workerEntries } from './src/lib/thread-pool'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    config: 'src/config/index.ts',
    ...workerEntries,
  },
  format: 'esm',
  outDir: 'dist/cli',
  platform: 'node',
  target: 'node18',
  splitting: false,
  sourcemap: true,
  outExtension() {
    return { js: '.mjs' }
  },
  external: ['@parcel/watcher', 'picomatch'],
})
