import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ProjectManager } from './project-manager'
import { GlobalProjectRegistry } from './project-registry'

// Build children are stubbed so no real build runs during unit tests: a project with generated
// types builds its model, and one without fails the way a real project does.
vi.mock('../child-process/process', async () => {
  const { existsSync, mkdirSync, writeFileSync } = await import('node:fs')
  const { dirname, join } = await import('node:path')
  class McpChildProcessError extends Error {
    constructor(
      public readonly errorType: 'config_not_found' | 'config_invalid' | 'missing_artifacts' | 'build_failed',
      message: string
    ) {
      super(message)
    }
  }
  return {
    McpChildProcessError,
    spawnMcpBuildChild: async (projectCwd: string) => {
      const modelPath = join(projectCwd, '.reference-ui', 'mcp', 'model.json')
      const manifestPath = join(projectCwd, '.reference-ui', 'types', 'tasty', 'manifest.js')
      if (!existsSync(manifestPath)) {
        throw new McpChildProcessError('missing_artifacts', "Run 'ref sync' to generate the model artifacts.")
      }
      mkdirSync(dirname(modelPath), { recursive: true })
      writeFileSync(
        modelPath,
        JSON.stringify({ schemaVersion: 1, generatedAt: '2026-01-01T00:00:00Z', components: [], tokens: [] })
      )
      return { modelPath, componentCount: 0 }
    },
    spawnMcpPrefetchAtlasChild: async () => {},
  }
})

/** A project with ui.config.ts; `synced` also writes the types manifest that `ref sync` produces. */
function writeProject(dir: string, options: { synced: boolean }): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'ui.config.ts'), 'export default {}')
  if (options.synced) {
    mkdirSync(join(dir, '.reference-ui', 'types', 'tasty'), { recursive: true })
    writeFileSync(join(dir, '.reference-ui', 'types', 'tasty', 'manifest.js'), 'export {}\n')
  }
}

function writeWorkspace(root: string): void {
  writeFileSync(join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")
}

describe('ProjectManager', () => {
  let testDir: string
  let registryFile: string
  let savedRefProject: string | undefined

  beforeEach(() => {
    const rawTestDir = join(tmpdir(), `ref-test-pm-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(rawTestDir, { recursive: true })
    testDir = realpathSync(rawTestDir)
    registryFile = join(testDir, 'registry.json')
    GlobalProjectRegistry.setRegistryPathForTesting(registryFile)
    savedRefProject = process.env.REF_PROJECT
    delete process.env.REF_PROJECT
  })

  afterEach(() => {
    GlobalProjectRegistry.setRegistryPathForTesting(null)
    if (savedRefProject === undefined) delete process.env.REF_PROJECT
    else process.env.REF_PROJECT = savedRefProject
    rmSync(testDir, { recursive: true, force: true })
  })

  it('initializes cleanly in empty directory and enters universal mode', async () => {
    const pm = new ProjectManager(testDir)
    await pm.initialize()
    expect(pm.getActiveProject()).toBeNull()
    expect(pm.resolveProject()).toBeNull()
  })

  it('selects a synced CWD project when ui.config.ts is present', async () => {
    writeProject(testDir, { synced: true })
    const pm = new ProjectManager(testDir)
    await pm.initialize()
    expect(pm.getActiveProject()).toBe(testDir)
  })

  it('does not default to an unsynced CWD project', async () => {
    writeProject(testDir, { synced: false })
    const pm = new ProjectManager(testDir)
    await pm.initialize()
    expect(pm.getActiveProject()).toBeNull()
  })

  it('prefers a synced workspace project over an unsynced CWD project', async () => {
    writeWorkspace(testDir)
    writeProject(testDir, { synced: false })
    const synced = join(testDir, 'packages', 'shared-ui')
    writeProject(synced, { synced: true })

    const pm = new ProjectManager(testDir)
    await pm.initialize()
    expect(pm.getActiveProject()).toBe(synced)
  })

  it('prefers a synced workspace project over an unsynced sibling that sorts first', async () => {
    writeWorkspace(testDir)
    const unsynced = join(testDir, 'packages', 'a-unsynced')
    const synced = join(testDir, 'packages', 'b-synced')
    writeProject(unsynced, { synced: false })
    writeProject(synced, { synced: true })

    const pm = new ProjectManager(testDir)
    await pm.initialize()
    expect(pm.getActiveProject()).toBe(synced)
  })

  it('defaults to a freshly synced project that has no MCP model yet', async () => {
    // `ref sync` writes only the types manifest; the model appears on the first build, so a
    // default keyed on the model alone would skip every project until it had been served once.
    writeWorkspace(testDir)
    writeProject(join(testDir, 'packages', 'a-unsynced'), { synced: false })
    const fresh = join(testDir, 'packages', 'b-fresh')
    writeProject(fresh, { synced: true })
    expect(existsSync(join(fresh, '.reference-ui', 'mcp', 'model.json'))).toBe(false)

    const pm = new ProjectManager(testDir)
    await pm.initialize()
    expect(pm.getActiveProject()).toBe(fresh)
  })

  it('keeps an explicit --project even when that project is unsynced', async () => {
    writeWorkspace(testDir)
    const synced = join(testDir, 'packages', 'a-synced')
    const explicit = join(testDir, 'packages', 'z-unsynced')
    writeProject(synced, { synced: true })
    writeProject(explicit, { synced: false })

    const pm = new ProjectManager(testDir, { project: 'packages/z-unsynced' })
    await pm.initialize()
    expect(pm.getActiveProject()).toBe(explicit)
  })

  it('leaves the default unset when no discovered project is synced', async () => {
    writeWorkspace(testDir)
    writeProject(join(testDir, 'packages', 'a-unsynced'), { synced: false })
    writeProject(join(testDir, 'packages', 'b-unsynced'), { synced: false })

    const pm = new ProjectManager(testDir)
    await pm.initialize()
    expect(pm.getActiveProject()).toBeNull()
    expect(pm.resolveProject()).toBeNull()
  })

  it('honors explicit --project option over auto-discovery', async () => {
    const pkgA = join(testDir, 'pkg-a')
    const pkgB = join(testDir, 'pkg-b')
    writeProject(pkgA, { synced: true })
    writeProject(pkgB, { synced: false })

    const pm = new ProjectManager(testDir, { project: 'pkg-b' })
    await pm.initialize()
    expect(pm.getActiveProject()).toBe(pkgB)
  })

  it('dynamically switches project via selectProject', async () => {
    const pkgA = join(testDir, 'pkg-a')
    const pkgB = join(testDir, 'pkg-b')
    writeProject(pkgA, { synced: true })
    writeProject(pkgB, { synced: false })

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
