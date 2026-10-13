// Removes every declaration file under dist/ before tsc emits the next set.
// tsc writes the declarations of the current program only, so a source that was
// deleted or moved leaves its old .d.ts behind, and the tarball ships it. Every
// file removed here is regenerated after this step: tsc emits the program,
// materialize-runtime copies the runtime and tasty declarations, and build-package
// writes theme/index.d.ts. Runtime .mjs and .css files are not touched.
import { readdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DECLARATION = /\.d\.(?:ts|mts|cts)$/

export async function cleanDeclarations(distDir) {
  let entries
  try {
    entries = await readdir(distDir, { recursive: true })
  } catch (error) {
    if (error?.code === 'ENOENT') return 0
    throw error
  }
  const stale = entries.filter((entry) => DECLARATION.test(entry))
  for (const entry of stale) await rm(resolve(distDir, entry), { force: true })
  return stale.length
}

const invokedDirectly = resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)

if (invokedDirectly) {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const removed = await cleanDeclarations(resolve(packageRoot, 'dist'))
  console.log(`clean-declarations: removed ${removed} stale declaration files from dist/`)
}
