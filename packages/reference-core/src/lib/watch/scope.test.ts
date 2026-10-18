// Unit tests for the watch trigger scope over temp trees, with the parcel subscribe and
// the config read mocked. They pin the widest merge a failed sync leaves behind, the
// narrowing a good sync applies, the subscription diff (an unchanged set churns nothing),
// and a root that cannot be subscribed: reported, left out, and never counted as added.

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { AsyncSubscription } from '@parcel/watcher'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAttemptedUserConfigDependencies, type LoadedUserConfig } from '../../config/load.ts'
import { canonicalPath } from './match.ts'
import { deriveScope, mergeScope, refreshTriggerScope, type TriggerScope } from './scope.ts'

const mocks = vi.hoisted(() => ({
  latest: undefined as unknown,
  failRoot: undefined as string | undefined,
  subscribed: [] as string[],
}))

vi.mock('@parcel/watcher', () => ({
  subscribe: vi.fn(async (root: string) => {
    if (root === mocks.failRoot) throw new Error(`cannot watch ${root}`)
    mocks.subscribed.push(root)
    return { unsubscribe: vi.fn(async () => {}) }
  }),
}))

vi.mock('../../config/load.ts', () => ({
  getLastLoadedUserConfig: vi.fn(() => mocks.latest),
  getAttemptedUserConfigDependencies: vi.fn(() => []),
}))

const tempDirs: string[] = []

beforeEach(() => {
  mocks.latest = undefined
  mocks.failRoot = undefined
  mocks.subscribed.length = 0
})

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function makeTree(files: string[]): string {
  const dir = canonicalPath(mkdtempSync(join(tmpdir(), 'core-watch-scope-')))
  tempDirs.push(dir)
  for (const rel of files) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true })
    writeFileSync(join(dir, rel), '//')
  }
  return dir
}

function loadedOf(include: string[]): LoadedUserConfig {
  return { config: { name: 'scope', include } as unknown as LoadedUserConfig['config'], dependencyPaths: [] }
}

// A live scope as the watch holds it after a boot against `include`, with one
// subscription per root; each handle's unsubscribe is a spy the tests read.
function liveOf(root: string, include: string[]): TriggerScope {
  const derived = deriveScope(root, loadedOf(include))
  const subscriptions = new Map<string, AsyncSubscription>()
  for (const dir of derived.roots) subscriptions.set(dir, { unsubscribe: vi.fn(async () => {}) })
  return {
    projectRoot: root,
    watchRoot: root,
    state: { watchRoot: root, isMatch: derived.isMatch, dependencyFiles: derived.dependencyFiles, snapshot: derived.snapshot },
    subscriptions,
    onEvent: vi.fn(),
    report: vi.fn(),
    currentRoots: derived.roots,
  }
}

describe('mergeScope', () => {
  it('keeps every match either scope made, and the roots of both', () => {
    const root = makeTree(['theme/a.ts', 'extra/b.ts'])
    const narrow = deriveScope(root, loadedOf(['theme/**/*.ts']))
    const wide = deriveScope(root, loadedOf(['extra/**/*.ts']))
    const merged = mergeScope(narrow, wide)
    expect(merged.isMatch('theme/a.ts')).toBe(true)
    expect(merged.isMatch('extra/b.ts')).toBe(true)
    expect([...merged.roots].sort()).toEqual([join(root, 'extra'), join(root, 'theme')].sort())
  })
})

describe('refreshTriggerScope', () => {
  it('widens after a failed sync so a file in a newly included dir is matched and subscribed', async () => {
    const root = makeTree(['theme/a.ts', 'extra/tokens.ts'])
    const scope = liveOf(root, ['theme/**/*.ts'])
    mocks.latest = loadedOf(['theme/**/*.ts', 'extra/**/*.ts'])

    const added = await refreshTriggerScope(scope, true)

    expect(added).toBe(true)
    expect(scope.state.isMatch('extra/tokens.ts')).toBe(true)
    expect(scope.state.isMatch('theme/a.ts')).toBe(true)
    expect(mocks.subscribed).toContain(join(root, 'extra'))
    expect(scope.currentRoots).toEqual(expect.arrayContaining([join(root, 'extra'), join(root, 'theme')]))
  })

  it('narrows after a good sync and unsubscribes the roots the config dropped', async () => {
    const root = makeTree(['theme/a.ts', 'extra/tokens.ts'])
    const scope = liveOf(root, ['theme/**/*.ts', 'extra/**/*.ts'])
    const extraSubscription = scope.subscriptions.get(join(root, 'extra'))
    mocks.latest = loadedOf(['theme/**/*.ts'])

    const added = await refreshTriggerScope(scope, false)

    expect(added).toBe(false)
    expect(scope.state.isMatch('extra/tokens.ts')).toBe(false)
    expect(scope.currentRoots).toEqual([join(root, 'theme')])
    expect(scope.subscriptions.has(join(root, 'extra'))).toBe(false)
    expect(extraSubscription?.unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('churns no subscription when the root set is unchanged', async () => {
    const root = makeTree(['theme/a.ts'])
    const scope = liveOf(root, ['theme/**/*.ts'])
    mocks.latest = loadedOf(['theme/**/*.ts'])

    expect(await refreshTriggerScope(scope, false)).toBe(false)
    expect(mocks.subscribed).toEqual([])
  })

  it('reports a root that cannot be subscribed, leaves it out, and does not count it as added', async () => {
    const root = makeTree(['theme/a.ts', 'extra/tokens.ts'])
    const scope = liveOf(root, ['theme/**/*.ts'])
    mocks.latest = loadedOf(['theme/**/*.ts', 'extra/**/*.ts'])
    mocks.failRoot = join(root, 'extra')

    const added = await refreshTriggerScope(scope, true)

    expect(added).toBe(false)
    expect(scope.report).toHaveBeenCalledWith(expect.objectContaining({ message: `cannot watch ${join(root, 'extra')}` }))
    expect(scope.currentRoots).toEqual([join(root, 'theme')])
  })
})

describe('dependency files the watch must still see', () => {
  const configOf = (include: string[]): LoadedUserConfig['config'] => ({ name: 'scope', include }) as unknown as LoadedUserConfig['config']

  it('keeps a dependency under an engine-ignored dir as its own root, so its re-sync is not dropped', () => {
    const root = makeTree(['ui.config.ts', 'node_modules/pkg/.reference-ui/system/baseSystem.mjs'])
    const upstream = join(root, 'node_modules', 'pkg', '.reference-ui', 'system', 'baseSystem.mjs')

    const derived = deriveScope(root, {
      config: configOf(['**/*.ts']),
      dependencyPaths: [join(root, 'ui.config.ts'), upstream],
    })

    expect(derived.dependencyFiles.has(upstream)).toBe(true)
    expect(derived.roots).toEqual(expect.arrayContaining([root, dirname(upstream)]))
  })

  it('watches a dependency that does not exist yet, through the nearest directory that does', () => {
    const root = makeTree(['ui.config.ts'])
    const missing = join(root, 'config', 'extra.ts')

    const derived = deriveScope(root, { config: configOf(['theme/**/*.ts']), dependencyPaths: [missing] })

    expect(derived.dependencyFiles.has(missing)).toBe(true)
    expect(derived.roots.every((dir) => existsSync(dir))).toBe(true)
  })

  it('widens to the files a failed load tried to import, so creating one resyncs', async () => {
    const root = makeTree(['theme/a.ts'])
    const missing = join(root, 'config', 'extra.ts')
    const scope = liveOf(root, ['theme/**/*.ts'])
    mocks.latest = loadedOf(['theme/**/*.ts'])
    vi.mocked(getAttemptedUserConfigDependencies).mockReturnValueOnce([missing])

    await refreshTriggerScope(scope, true)

    expect(scope.state.dependencyFiles.has(missing)).toBe(true)
  })
})
