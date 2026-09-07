import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ProjectManager } from './project-manager'
import { GlobalProjectRegistry } from '../../lib/paths/global-registry'

describe('ProjectManager', () => {
  let testDir: string
  let registryFile: string

  beforeEach(() => {
    const rawTestDir = join(tmpdir(), `ref-test-pm-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(rawTestDir, { recursive: true })
    testDir = realpathSync(rawTestDir)
    registryFile = join(testDir, 'registry.json')
    GlobalProjectRegistry.setRegistryPathForTesting(registryFile)
  })

  afterEach(() => {
    GlobalProjectRegistry.setRegistryPathForTesting(null)
    rmSync(testDir, { recursive: true, force: true })
  })

  it('initializes cleanly in empty directory and enters universal mode', async () => {
    const pm = new ProjectManager(testDir)
    await pm.initialize()
    expect(pm.getActiveProject()).toBeNull()
    expect(pm.resolveProject()).toBeNull()
  })

  it('selects CWD project when ui.config.ts is present', async () => {
    writeFileSync(join(testDir, 'ui.config.ts'), 'export default {}')
    const pm = new ProjectManager(testDir)
    await pm.initialize()
    expect(pm.getActiveProject()).toBe(testDir)
  })

  it('honors explicit --project option over auto-discovery', async () => {
    const pkgA = join(testDir, 'pkg-a')
    const pkgB = join(testDir, 'pkg-b')
    mkdirSync(pkgA, { recursive: true })
    mkdirSync(pkgB, { recursive: true })
    writeFileSync(join(pkgA, 'ui.config.ts'), 'export default {}')
    writeFileSync(join(pkgB, 'ui.config.ts'), 'export default {}')

    const pm = new ProjectManager(testDir, { project: 'pkg-b' })
    await pm.initialize()
    expect(pm.getActiveProject()).toBe(pkgB)
  })

  it('dynamically switches project via selectProject', async () => {
    const pkgA = join(testDir, 'pkg-a')
    const pkgB = join(testDir, 'pkg-b')
    mkdirSync(pkgA, { recursive: true })
    mkdirSync(pkgB, { recursive: true })
    writeFileSync(join(pkgA, 'ui.config.ts'), 'export default {}')
    writeFileSync(join(pkgB, 'ui.config.ts'), 'export default {}')

    const pm = new ProjectManager(pkgA)
    await pm.initialize()
    expect(pm.getActiveProject()).toBe(pkgA)

    const switchResult = pm.selectProject(pkgB)
    expect('error' in switchResult).toBe(false)
    expect(pm.getActiveProject()).toBe(pkgB)
  })

  it('resolves subdirectories to parent project root', async () => {
    const pkg = join(testDir, 'my-lib')
    const sub = join(pkg, 'src', 'components')
    mkdirSync(sub, { recursive: true })
    writeFileSync(join(pkg, 'ui.config.ts'), 'export default {}')

    const pm = new ProjectManager(testDir)
    await pm.initialize()

    const resolved = pm.resolveProject(sub)
    expect(resolved).toBe(pkg)
  })

  it('caches McpModelState per canonical project path', () => {
    const pkg = join(testDir, 'cached-lib')
    mkdirSync(pkg, { recursive: true })
    writeFileSync(join(pkg, 'ui.config.ts'), 'export default {}')

    const pm = new ProjectManager(testDir)
    const state1 = pm.getOrCreateState(pkg)
    const state2 = pm.getOrCreateState(pkg)
    expect(state1).toBe(state2)

    pm.invalidateProject(pkg)
    const state3 = pm.getOrCreateState(pkg)
    expect(state3).not.toBe(state1)
  })

  it('strictly matches project suffix on path boundaries', async () => {
    const pkgFooBar = join(testDir, 'foobar')
    const pkgBar = join(testDir, 'bar')
    mkdirSync(pkgFooBar, { recursive: true })
    mkdirSync(pkgBar, { recursive: true })
    writeFileSync(join(pkgFooBar, 'ui.config.ts'), 'export default {}')
    writeFileSync(join(pkgBar, 'ui.config.ts'), 'export default {}')

    const pm = new ProjectManager(testDir)
    await pm.initialize()

    // Querying 'bar' must match pkgBar, never foobar
    const matched = pm.resolveProject('bar')
    expect(matched).toBe(pkgBar)
  })
})
