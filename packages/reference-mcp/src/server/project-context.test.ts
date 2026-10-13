import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { executeWithProject, notSyncedMessage } from './project-context'
import { ProjectManager } from './project-manager'
import { GlobalProjectRegistry } from './project-registry'
import { UNIVERSAL_PRIMITIVES_NOTICE } from './universal-primitives'

// Build children are stubbed: a project with generated types builds its model, and one without
// fails the way a real project without `ref sync` output does.
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

type ToolResult = {
  content: Array<{ type: string; text: string }>
  isError?: boolean
  structuredContent?: Record<string, unknown>
}

/** A project with ui.config.ts; `synced` also writes the types manifest that `ref sync` produces. */
function writeProject(dir: string, options: { synced: boolean }): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'ui.config.ts'), 'export default {}')
  if (options.synced) {
    mkdirSync(join(dir, '.reference-ui', 'types', 'tasty'), { recursive: true })
    writeFileSync(join(dir, '.reference-ui', 'types', 'tasty', 'manifest.js'), 'export {}\n')
  }
}

async function runTool(projectManager: ProjectManager): Promise<ToolResult> {
  return (await executeWithProject(
    projectManager,
    undefined,
    () => ({ answered: true }),
    () => ({ mode: 'universal_primitives' })
  )) as ToolResult
}

describe('executeWithProject default resolution', () => {
  let testDir: string
  let savedRefProject: string | undefined

  beforeEach(() => {
    const rawTestDir = join(tmpdir(), `ref-test-ctx-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(rawTestDir, { recursive: true })
    testDir = realpathSync(rawTestDir)
    GlobalProjectRegistry.setRegistryPathForTesting(join(testDir, 'registry.json'))
    savedRefProject = process.env.REF_PROJECT
    delete process.env.REF_PROJECT
    writeFileSync(join(testDir, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")
  })

  afterEach(() => {
    GlobalProjectRegistry.setRegistryPathForTesting(null)
    if (savedRefProject === undefined) delete process.env.REF_PROJECT
    else process.env.REF_PROJECT = savedRefProject
    rmSync(testDir, { recursive: true, force: true })
  })

  it('runs the handler against a synced default project', async () => {
    const synced = join(testDir, 'packages', 'ui')
    writeProject(synced, { synced: true })

    const pm = new ProjectManager(testDir)
    await pm.initialize()
    const res = await runTool(pm)

    expect(res.isError).toBeUndefined()
    expect(res.structuredContent).toMatchObject({ answered: true, activeProject: synced })
  })

  it('serves universal primitives, not the unsynced error, when nothing is synced', async () => {
    writeProject(join(testDir, 'packages', 'ui'), { synced: false })

    const pm = new ProjectManager(testDir)
    await pm.initialize()
    const res = await runTool(pm)

    expect(res.isError).toBeUndefined()
    expect(res.structuredContent).toMatchObject({ mode: 'universal_primitives', activeProject: null })
  })

  it('names the unsynced config in the universal notice instead of saying none was found', async () => {
    const unsynced = join(testDir, 'packages', 'ui')
    writeProject(unsynced, { synced: false })

    const pm = new ProjectManager(testDir)
    await pm.initialize()
    const res = await runTool(pm)

    expect(res.structuredContent?.notice).toContain(`found in '${unsynced}'`)
    expect(res.structuredContent?.notice).toContain("run 'ref sync'")
    expect(res.structuredContent?.notice).not.toContain('No ui.config')
  })

  it('keeps the no-config notice when the workspace has no ui.config at all', async () => {
    const pm = new ProjectManager(testDir)
    await pm.initialize()
    const res = await runTool(pm)

    expect(res.structuredContent).toMatchObject({ mode: 'universal_primitives', notice: UNIVERSAL_PRIMITIVES_NOTICE })
  })

  it('reports the not-synced error for an explicit unsynced --project', async () => {
    writeProject(join(testDir, 'packages', 'ui'), { synced: false })

    const pm = new ProjectManager(testDir, { project: 'packages/ui' })
    await pm.initialize()
    const res = await runTool(pm)

    expect(res.isError).toBe(true)
    expect(res.content[0]?.text).toContain('has not been synced yet')
    expect(res.content[0]?.text).toContain("Run 'ref sync'")
  })

  it('degrades a synced default to the not-synced error once its artifacts are gone', async () => {
    const synced = join(testDir, 'packages', 'ui')
    writeProject(synced, { synced: true })

    const pm = new ProjectManager(testDir)
    await pm.initialize()
    expect((await runTool(pm)).isError).toBeUndefined()

    rmSync(join(synced, '.reference-ui'), { recursive: true, force: true })
    const lost = await runTool(pm)
    expect(lost.isError).toBe(true)
    expect(lost.content[0]?.text).toBe(notSyncedMessage(synced))
    expect(lost.content[0]?.text).toContain("Run 'ref sync'")

    // A re-sync brings the project back without a restart: the dropped cache is rebuilt.
    mkdirSync(join(synced, '.reference-ui', 'mcp'), { recursive: true })
    writeFileSync(join(synced, '.reference-ui', 'mcp', 'model.json'), '{"schemaVersion":1,"components":[],"tokens":[]}')
    const restored = await runTool(pm)
    expect(restored.isError).toBeUndefined()
    expect(restored.structuredContent).toMatchObject({ answered: true, activeProject: synced })
  })
})
