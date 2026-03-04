import { defineConfig } from 'tsup'
import { workerEntries } from './src/lib/thread-pool'
import { cp, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const LIQUID_SRC = 'src/system/config/liquid'
const CONFIG_DIST = 'dist/cli/config'

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
  async onSuccess() {
    // Copy .liquid files to dist/cli/config so bundled worker can read them via __dirname
    const files = await readdir(LIQUID_SRC)
    const liquidFiles = files.filter((f) => f.endsWith('.liquid'))
    await Promise.all(
      liquidFiles.map((f) =>
        cp(join(LIQUID_SRC, f), join(CONFIG_DIST, f))
      )
    )
  },
})
