import { defineConfig } from 'tsup'
import { mkdirSync } from 'node:fs'
import { cp, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { workerEntries } from './src/lib/thread-pool'

const LIQUID_SRC = 'src/system/config/liquid'
const CONFIG_DIST = 'dist/cli/config'
const STYLED_SRC = resolve('src/system/styled')
const STYLED_DIST = 'dist/cli/styled'

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
    // Copy .liquid files to dist/cli/config so bundled worker can read them via __dirname
    const files = await readdir(LIQUID_SRC)
    const liquidFiles = files.filter((f) => f.endsWith('.liquid'))
    await Promise.all(
      liquidFiles.map((f) =>
        cp(join(LIQUID_SRC, f), join(CONFIG_DIST, f))
      )
    )
    // Copy internal-fragments.mjs when it exists (produced by prebuild / build:styled)
    try {
      mkdirSync(STYLED_DIST, { recursive: true })
      await cp(
        join(STYLED_SRC, 'internal-fragments.mjs'),
        join(STYLED_DIST, 'internal-fragments.mjs')
      )
    } catch {
      // prebuild may not have run yet
    }
  },
})
