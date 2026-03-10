import { defineConfig } from 'tsup'
import { workerEntries } from './src/lib/thread-pool'
import { copyLiquidTemplates } from './tsup/liquid'

export default defineConfig({
  entry: {
    public: 'src/public.ts',
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
  external: ['@pandacss/node', '@parcel/watcher', 'picomatch'],
  async onSuccess() {
    await copyLiquidTemplates({
      sources: ['src/system/panda/config/liquid'],
      dest: 'dist/cli/config',
    })
  },
})
