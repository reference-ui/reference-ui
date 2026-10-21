// File walk shared by the docs gate tiers. It takes an entry path and a set of extensions, and
// adds every file under the entry with a matching extension to `out`. Build output, caches and
// dependencies are skipped, so a tier never reads generated code.
import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.content-collections',
  '.reference-ui',
  '.git',
])

export async function walk(entry, exts, out) {
  let info
  try {
    info = await stat(entry)
  } catch {
    return
  }
  if (!info.isDirectory()) {
    if (exts.has(path.extname(entry).toLowerCase())) out.add(path.resolve(entry))
    return
  }
  if (SKIP_DIRS.has(path.basename(entry))) return
  for (const kid of await readdir(entry)) await walk(path.join(entry, kid), exts, out)
}
