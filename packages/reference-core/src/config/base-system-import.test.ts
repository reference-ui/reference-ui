// Guard for the @reference-ui/lib/baseSystem subpath migration.
// It takes every in-repo ui.config under packages/ and matrix/ and fails if the
// config — or any module it reaches through relative imports — pulls in the lib
// barrel `@reference-ui/lib` at all: named, namespace, side-effect, re-export,
// dynamic import, or require. The barrel is the cost: it drags the whole
// ~7.7k-module icons graph into config evaluation (~1.5 s) while the subpath is
// one 512 KB module, so a helper that imports it would silently restore the
// regression. It also pins the three configs migrated off the barrel so a
// revert cannot land silently. A pruning source walk, not a repo-wide glob:
// other checkouts under dot-directories must never be read.

import { mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
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
// Relative module positions only — bare specifiers and aliases are out of
// scope. Config bundling bundles relative helpers (`bundle.ts`) while leaving
// `@reference-ui/lib` external, so a helper that reaches the barrel during
// config evaluation is exactly the shape this walk must follow.
const RELATIVE_IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)['"](\.[^'"]+)['"]/g
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.mjs', '.cts', '.cjs', '.js', '.jsx', '.json']
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

// Resolve a relative specifier to a real file, trying extensionless, explicit
// extension, and directory-index forms. Returns null when nothing matches so an
// unresolvable relative import is skipped rather than crashing the guard.
async function resolveRelative(fromFile: string, specifier: string): Promise<string | null> {
  const base = resolve(dirname(fromFile), specifier)
  const candidates = [
    base,
    ...RESOLVE_EXTENSIONS.map((ext) => `${base}${ext}`),
    ...RESOLVE_EXTENSIONS.map((ext) => join(base, `index${ext}`)),
  ]
  for (const candidate of candidates) {
    const info = await stat(candidate).catch(() => null)
    if (info?.isFile()) return candidate
  }
  return null
}

// Transitive closure of a module and the relative imports it reaches. The
// `seen` set doubles as the cycle guard: a mutually-importing helper pair
// terminates instead of looping.
async function reachableModules(entry: string): Promise<Set<string>> {
  const seen = new Set<string>()
  const queue = [resolve(entry)]
  while (queue.length > 0) {
    const file = queue.pop()
    if (file === undefined || seen.has(file)) continue
    seen.add(file)
    const text = await readFile(file, 'utf8').catch(() => null)
    if (text === null) continue
    for (const match of text.matchAll(RELATIVE_IMPORT)) {
      const resolved = await resolveRelative(file, match[1])
      if (resolved !== null && !seen.has(resolved)) queue.push(resolved)
    }
  }
  return seen
}

// Every module in the reachable closure of the given config entry points whose
// source reaches the barrel. Empty means the guard holds.
async function barrelOffenders(configs: readonly string[]): Promise<string[]> {
  const offenders = new Set<string>()
  for (const config of configs) {
    for (const module of await reachableModules(config)) {
      const text = await readFile(module, 'utf8').catch(() => '')
      if (BARREL_IMPORT.test(text)) offenders.add(module)
    }
  }
  return [...offenders].sort()
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

  it('has no ui.config reaching the lib barrel through a relative helper', async () => {
    const files = await configFiles()
    // A scanner that finds nothing would pass vacuously; the repo has many.
    expect(files.length).toBeGreaterThan(10)

    const offenders = await barrelOffenders(files)
    expect(offenders.map((file) => file.slice(REPO_ROOT.length + 1))).toEqual([])
  })

  it('catches a config whose relative helper imports the barrel', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ref-barrel-guard-'))
    try {
      // config -> a -> b(barrel), with b <-> c forming a cycle the walk must
      // survive while still reaching b.
      await writeFile(join(dir, 'ui.config.ts'), "import { a } from './a.ts'\nexport default a\n")
      await writeFile(join(dir, 'a.ts'), "import { b } from './b.ts'\nexport const a = b\n")
      await writeFile(
        join(dir, 'b.ts'),
        "import { c } from './c.ts'\nimport { baseSystem } from '@reference-ui/lib'\nexport const b = { c, baseSystem }\n"
      )
      await writeFile(join(dir, 'c.ts'), "import { b } from './b.ts'\nexport const c = b\n")

      const offenders = await barrelOffenders([join(dir, 'ui.config.ts')])
      expect(offenders.map((file) => file.slice(dir.length + 1))).toEqual(['b.ts'])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('covers the three configs migrated off the barrel', async () => {
    for (const rel of MIGRATED) {
      const text = await readFile(join(REPO_ROOT, rel), 'utf8')
      expect(text, `${rel} must use the subpath`).toMatch(SUBPATH_IMPORT)
      expect(text, `${rel} must not use the barrel`).not.toMatch(BARREL_IMPORT)
    }
  })
})
