import { defineConfig } from 'tsup'
import { resolve } from 'node:path'
import { workerEntries } from './src/lib/thread-pool'
import { copyLiquidTemplates } from './tsup/liquid'
import { copyFile } from './tsup/copy'

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
  external: ['@pandacss/node', '@parcel/watcher', 'picomatch'],
  async onSuccess() {
    await copyLiquidTemplates({
      sources: [
        'src/system/config/liquid',
        'src/system/patterns/liquid',
      ],
      dest: 'dist/cli/config',
    })
    await copyFile({
      src: resolve('src/system/styled/internal-fragments.mjs'),
      dest: resolve('dist/cli/styled/internal-fragments.mjs'),
    })
    await copyFile({
      src: resolve('src/system/styled/fragments/internal/patterns.mjs'),
      dest: resolve('dist/cli/styled/fragments/internal/patterns.mjs'),
    })
  },
})
