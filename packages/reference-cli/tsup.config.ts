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
  // Bundle .ejs templates as text strings — no file copying needed at runtime
  loader: { '.ejs': 'text' },
})
