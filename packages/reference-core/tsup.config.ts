import { defineConfig } from 'tsup'
import { workerEntries } from './src/lib/thread-pool/worker-entries'
import { copyLiquidTemplates } from './tools/tsup/liquid'

export default defineConfig({
  entry: {
    public: 'src/public.ts',
    index: 'src/index.ts',
    config: 'src/config/index.ts',
    constants: 'src/constants.ts',
    'mcp-child': 'src/mcp/worker/child-process/entry.ts',
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
