/**
 * Stale-dist guard for tests that bundle through the package's published
 * entries. Takes entry names from `scripts/build-bundle.mjs`, rebuilds them in
 * memory with the same esbuild options, and compares the bytes against
 * `dist/`. Throws one message naming every stale entry and the rebuild
 * command, so a byte pin never silently measures an old build.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { bundleOptions, ENTRIES } from '../../../../scripts/build-bundle.mjs'

const PKG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')
const DIST = path.join(PKG, 'dist')

/** Throws when any named entry's `dist/<name>.mjs` differs from a fresh build. */
export async function assertDistFresh(names: (keyof typeof ENTRIES)[]): Promise<void> {
  const entryPoints = Object.fromEntries(names.map((name) => [name, ENTRIES[name]]))
  const fresh = await build({ ...bundleOptions(entryPoints), outdir: DIST, write: false })
  const stale = fresh.outputFiles
    .filter((file) => {
      const shipped = fs.existsSync(file.path) ? fs.readFileSync(file.path, 'utf8') : undefined
      return shipped !== file.text
    })
    .map((file) => path.relative(PKG, file.path))
  if (stale.length > 0) {
    throw new Error(
      `stale ${stale.join(', ')}: rebuild with \`pnpm run build:js\` in packages/reference-rs`
    )
  }
}
