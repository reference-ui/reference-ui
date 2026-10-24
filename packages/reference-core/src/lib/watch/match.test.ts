// Unit tests for the watch matching seam over temp trees, no watcher running.
// They pin the engine's include semantics (dot entries match, a negated pattern
// subtracts, `[!b]` is a negated class, engine-ignored directories never match),
// the watch-root derivation, the symlink-target snapshot, and the subtree probe a
// moved-in directory passes.

import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProjectPlan } from '../../collect/lib/scan/project-files.ts'
import {
  canonicalPath,
  createIncludeMatcher,
  deriveWatchRoots,
  dirHoldsMatch,
  ENGINE_IGNORE_GLOBS,
  isEngineIgnoredDir,
  isEngineIgnoredFile,
  scanMatches,
} from './match.ts'

// Every plan the watch matcher's own ownership walk returns; the listing's walks run inside project-files and are not recorded.
const ownershipPlans = vi.hoisted((): ProjectPlan[] => [])

vi.mock('../../collect/lib/scan/project-files.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../collect/lib/scan/project-files.ts')>()
  return {
    ...original,
    planProjectWalk: (...args: Parameters<typeof original.planProjectWalk>) => {
      const plan = original.planProjectWalk(...args)
      ownershipPlans.push(plan)
      return plan
    },
  }
})

const tempDirs: string[] = []

afterEach(() => {
  ownershipPlans.length = 0
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

// A canonical temp root with the given files written under it.
function makeTree(files: Record<string, string>): string {
  const dir = canonicalPath(mkdtempSync(join(tmpdir(), 'core-watch-match-')))
  tempDirs.push(dir)
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true })
    writeFileSync(join(dir, rel), body)
  }
  return dir
}

describe('include matcher', () => {
  it('matches dot entries the way the engine walk does', () => {
    const matches = createIncludeMatcher(['theme/**/*.{ts,tsx}'])
    expect(matches('theme/.hidden.ts')).toBe(true)
    expect(matches('theme/.nested/c.ts')).toBe(true)
  })

  it('never matches a path under an engine-ignored directory', () => {
    const matches = createIncludeMatcher(['**/*.ts'])
    expect(matches('theme/dist/a.ts')).toBe(false)
    expect(matches('packages/node_modules/pkg/a.ts')).toBe(false)
    expect(matches('theme/a.ts')).toBe(true)
  })

  it('keeps a file named like an ignored directory', () => {
    expect(createIncludeMatcher(['**/*'])('theme/dist')).toBe(true)
  })

  it('lets a negated pattern subtract from the positive globs', () => {
    const matches = createIncludeMatcher(['theme/**/*.ts', '!theme/skip/**'])
    expect(matches('theme/a.ts')).toBe(true)
    expect(matches('theme/skip/b.ts')).toBe(false)
  })

  it('reads [!b] as a negated class, as the listing does', () => {
    const matches = createIncludeMatcher(['src/a[!b].ts'])
    expect(matches('src/ac.ts')).toBe(true)
    expect(matches('src/ab.ts')).toBe(false)
    const subtracts = createIncludeMatcher(['src/a*.ts', '!src/a[!b].ts'])
    expect(subtracts('src/ab.ts')).toBe(true)
    expect(subtracts('src/ac.ts')).toBe(false)
  })
})

describe('engine ignore set', () => {
  it('ignores a directory name above a file but not a file of that name', () => {
    expect(isEngineIgnoredFile('theme/dist/a.ts')).toBe(true)
    expect(isEngineIgnoredFile('theme/dist')).toBe(false)
    expect(isEngineIgnoredDir('theme/dist')).toBe(true)
    expect(isEngineIgnoredDir('theme/a.ts')).toBe(false)
  })

  it('carries the generated folder and node_modules as watcher globs', () => {
    expect(ENGINE_IGNORE_GLOBS).toEqual(expect.arrayContaining(['**/.reference-ui/**', '**/node_modules/**']))
  })
})

describe('watch roots', () => {
  it('watches the static head of each positive include glob', () => {
    const root = makeTree({})
    expect(deriveWatchRoots(root, ['theme/**/*.{ts,tsx}'])).toEqual([join(root, 'theme')])
  })

  it('watches the project root for an unrooted include', () => {
    const root = makeTree({})
    expect(deriveWatchRoots(root, ['**/*.ts'])).toEqual([root])
  })

  it('adds extra dirs and collapses any nested under a kept root', () => {
    const root = makeTree({})
    expect(deriveWatchRoots(root, ['theme/**/*.ts'], [join(root, 'shared'), join(root, 'theme', 'deep')])).toEqual([
      join(root, 'theme'),
      join(root, 'shared'),
    ])
  })

  it('never adds a root for a negated pattern', () => {
    const root = makeTree({})
    expect(deriveWatchRoots(root, ['!theme/skip/**', 'theme/**/*.ts'])).toEqual([join(root, 'theme')])
  })

  it('keeps a rooted prefix outside the root when an unrooted include is also present', () => {
    const root = makeTree({})
    const shared = join(dirname(root), 'shared')
    expect(deriveWatchRoots(root, ['**/*.tsx', '../shared/**']).sort()).toEqual([root, shared].sort())
  })

  it('watches the directory holding an exact file include, never the file itself', () => {
    const root = makeTree({ 'src/repro/main.tsx': 'm', 'tokens.ts': 't' })
    expect(deriveWatchRoots(root, ['src/repro/main.tsx'])).toEqual([join(root, 'src', 'repro')])
    expect(deriveWatchRoots(root, ['tokens.ts'])).toEqual([root])
  })
})

describe('match snapshot', () => {
  it('records the directories above matches and skips engine-ignored ones', () => {
    const root = makeTree({
      'theme/a.ts': 'a',
      'theme/.hidden.ts': 'h',
      'theme/box/b.ts': 'b',
      'theme/dist/x.ts': 'x',
    })
    const snapshot = scanMatches(root, ['theme/**/*.ts'])
    expect(snapshot.dirs).toEqual(new Set(['theme', 'theme/box']))
    expect(snapshot.links.size).toBe(0)
  })

  it('maps a symlinked match to its real target and that target dir', () => {
    const root = makeTree({ 'shared/colors.ts': 'c', 'theme/base.ts': 'b' })
    symlinkSync('../shared/colors.ts', join(root, 'theme', 'linked.ts'))
    const snapshot = scanMatches(root, ['theme/**/*.ts'])
    expect(snapshot.links.get(join(root, 'shared', 'colors.ts'))).toBe('theme/linked.ts')
    expect(snapshot.linkDirs).toEqual([join(root, 'shared')])
  })

  it('subscribes the real target of an empty symlinked directory and maps it back to the link', () => {
    const root = makeTree({ 'shared/seed.md': 's', 'theme/base.ts': 'b' })
    mkdirSync(join(root, 'shared', 'empty'))
    symlinkSync(join('..', 'shared', 'empty'), join(root, 'theme', 'linkdir'), 'dir')
    const snapshot = scanMatches(root, ['theme/**/*.ts'])
    expect(snapshot.targetDirs.get(join(root, 'shared', 'empty'))).toBe('theme/linkdir')
    expect(snapshot.linkDirs).toContain(join(root, 'shared', 'empty'))
  })

  it('walks only the directories an include reaches when it looks for linked directories', () => {
    const root = makeTree({ 'src/a.ts': 'a', 'shared/seed.md': 's', 'other/b.ts': 'b', 'other/deep/c.ts': 'c' })
    symlinkSync(join('..', 'shared'), join(root, 'src', 'linkdir'), 'dir')
    symlinkSync(join('..', 'shared'), join(root, 'other', 'outlink'), 'dir')
    const snapshot = scanMatches(root, ['src/**'])
    expect(snapshot.targetDirs.get(join(root, 'shared'))).toBe('src/linkdir')
    const entered = ownershipPlans.flatMap((plan) => [...plan.dirs.keys()])
    expect(entered).toContain(join(root, 'src'))
    expect(entered.filter((dir) => dir.startsWith(join(root, 'other')))).toEqual([])
  })

  it('skips the linked-directory walk when no positive include sits inside the root', () => {
    const root = makeTree({ 'src/a.ts': 'a' })
    scanMatches(root, ['../shared/**', '!src/**'])
    expect(ownershipPlans).toEqual([])
  })

  it('scans exact file includes without walking into the files as directories', () => {
    const root = makeTree({ 'src/repro/main.tsx': 'm', 'src/repro/tokens.ts': 't' })
    const snapshot = scanMatches(root, ['src/repro/main.tsx', 'src/repro/tokens.ts'])
    expect(snapshot.dirs).toEqual(new Set(['src', 'src/repro']))
    expect(snapshot.targetDirs.size).toBe(0)
  })

  it('skips a dangling symlink without failing the scan', () => {
    const root = makeTree({ 'theme/base.ts': 'b' })
    symlinkSync('../missing.ts', join(root, 'theme', 'gone.ts'))
    expect(() => scanMatches(root, ['theme/**/*.ts'])).not.toThrow()
    expect(scanMatches(root, ['theme/**/*.ts']).links.size).toBe(0)
  })
})

describe('subtree probe', () => {
  it('holds only when the subtree carries a path the include matches', () => {
    const root = makeTree({ 'theme/box/readme.md': 'r', 'theme/other/a.ts': 'a' })
    const matches = createIncludeMatcher(['theme/**/*.ts'])
    expect(dirHoldsMatch(root, 'theme/box', matches)).toBe(false)
    expect(dirHoldsMatch(root, 'theme/other', matches)).toBe(true)
  })
})
