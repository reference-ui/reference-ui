/**
 * Input-tree walker for the atomic case helpers: the source files a case folder holds, sorted by
 * path, with build and metadata directories skipped. Takes a root directory and returns virtual
 * sources ready to hand to `compile` as `files`, so the order-independence gauge can reverse them
 * and compare the artifacts that come back.
 */
import fs from 'node:fs'
import path from 'node:path'

import type { VirtualSource } from '../../js/types.js'

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx'])
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.turbo',
  'target',
  '.reference-ui',
  '.reference',
  '.pipeline',
  '.content-collections',
])

export function collectInputSources(rootDir: string): VirtualSource[] {
  const files: VirtualSource[] = []
  walkInputDir(rootDir, files)
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  return files
}

function walkInputDir(dir: string, files: VirtualSource[]): void {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  for (const entry of entries) {
    pushInputEntry(path.join(dir, entry.name), entry, files)
  }
}

function pushInputEntry(full: string, entry: fs.Dirent, files: VirtualSource[]): void {
  if (entry.isDirectory()) {
    if (!SKIP_DIRS.has(entry.name)) {
      walkInputDir(full, files)
    }
    return
  }
  if (SOURCE_EXT.has(path.extname(entry.name))) {
    files.push({ path: full, content: fs.readFileSync(full, 'utf8') })
  }
}
