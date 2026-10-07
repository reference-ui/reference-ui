// Guard for the @reference-ui/lib/baseSystem subpath migration.
// It takes every in-repo ui.config under packages/ and matrix/ as data and
// fails if any reaches the lib barrel `@reference-ui/lib` at all — named,
// namespace, side-effect, re-export, dynamic import, or require. The barrel
// itself is the cost: it drags the whole ~7.7k-module icons graph into config
// evaluation (~1.5 s) while the subpath is one 512 KB module. It also pins the
// three configs migrated off the barrel so a revert cannot land silently. A
// pruning source walk, not a repo-wide glob: other checkouts under
// dot-directories must never be read.

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = fileURLToPath(new URL('../../../../', import.meta.url))
const ROOTS = ['packages', 'matrix']
const CONFIG_FILE = /^ui\.config\.(ts|js|mts|mjs)$/
const SKIP_DIR = new Set(['node_modules', 'dist', '.git', '.reference-ui', 'target', '.muse'])
// The exact barrel specifier in any module position. The trailing quote is
// load-bearing: it admits `@reference-ui/lib` and rejects `@reference-ui/lib/…`
// subpaths. A bare string in a config payload (e.g. `include:
// ['@reference-ui/lib']`) is not a module position and must not trip the guard.
const BARREL_IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)['"]@reference-ui\/lib['"]/
const SUBPATH_IMPORT = /from\s*['"]@reference-ui\/lib\/baseSystem['"]/
const MIGRATED = [
  'packages/reference-docs/ui.config.ts',
  'matrix/tests/mcp/ui.config.ts',
  'matrix/tests/chain/T16/ui.config.ts',
]

async function walk(dir: string, acc: string[]): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIR.has(entry.name)) await walk(join(dir, entry.name), acc)
    } else if (CONFIG_FILE.test(entry.name)) {
      acc.push(join(dir, entry.name))
    }
  }
  return acc
}

async function configFiles(): Promise<string[]> {
  const files: string[] = []
  for (const root of ROOTS) await walk(join(REPO_ROOT, root), files)
  return files.sort()
}

describe('@reference-ui/lib/baseSystem subpath', () => {
  it('detects every barrel shape it bans', () => {
    const banned = [
      "import { baseSystem } from '@reference-ui/lib'",
      "import { baseSystem as s } from '@reference-ui/lib'",
      "import * as lib from '@reference-ui/lib'",
      "import lib from '@reference-ui/lib'",
      "import '@reference-ui/lib'",
      "export { baseSystem } from '@reference-ui/lib'",
      "export * from '@reference-ui/lib'",
      "const lib = await import('@reference-ui/lib')",
      "const lib = require('@reference-ui/lib')",
    ]
    for (const source of banned) expect(BARREL_IMPORT.test(source), source).toBe(true)

    const allowed = [
      "import { baseSystem } from '@reference-ui/lib/baseSystem'",
      "import { baseSystem as s } from '@reference-ui/lib/baseSystem'",
      "import * as lib from '@reference-ui/lib/baseSystem'",
      "export { baseSystem } from '@reference-ui/lib/baseSystem'",
      "export * from '@reference-ui/lib/baseSystem'",
      "const lib = await import('@reference-ui/lib/baseSystem')",
      "const lib = require('@reference-ui/lib/baseSystem')",
      "mcp: { include: ['@reference-ui/lib'] }",
    ]
    for (const source of allowed) expect(BARREL_IMPORT.test(source), source).toBe(false)

    expect(SUBPATH_IMPORT.test("import { baseSystem } from '@reference-ui/lib/baseSystem'")).toBe(true)
  })

  it('has no ui.config reaching the lib barrel', async () => {
    const files = await configFiles()
    // A scanner that finds nothing would pass vacuously; the repo has many.
    expect(files.length).toBeGreaterThan(10)

    const offenders: string[] = []
    for (const file of files) {
      const text = await readFile(file, 'utf8')
      if (BARREL_IMPORT.test(text)) offenders.push(file.slice(REPO_ROOT.length + 1))
    }
    expect(offenders).toEqual([])
  })

  it('covers the three configs migrated off the barrel', async () => {
    for (const rel of MIGRATED) {
      const text = await readFile(join(REPO_ROOT, rel), 'utf8')
      expect(text, `${rel} must use the subpath`).toMatch(SUBPATH_IMPORT)
      expect(text, `${rel} must not use the barrel`).not.toMatch(BARREL_IMPORT)
    }
  })
})
