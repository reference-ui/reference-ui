import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { executeWithProject } from './project-context'
import { ProjectManager } from './project-manager'
import { GlobalProjectRegistry } from './project-registry'

// Build children are stubbed: a synced project rebuilds from its artifact, an unsynced one
// fails the way a real project without generated types does.
vi.mock('../child-process/process', async () => {
  const { existsSync } = await import('node:fs')
  const { join } = await import('node:path')
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
      if (existsSync(modelPath)) return { modelPath, componentCount: 0 }
      throw new McpChildProcessError('missing_artifacts', "Run 'ref sync' to generate the model artifacts.")
    },
    spawnMcpPrefetchAtlasChild: async () => {},
  }
})

const MINIMAL_ARTIFACT = {
  schemaVersion: 1,
  generatedAt: '2026-01-01T00:00:00Z',
  workspaceRoot: '/test',
  manifestPath: '/test/manifest.js',
  diagnostics: [],
  components: [],
  tokens: [],
}

type ToolResult = {
  content: Array<{ type: string; text: string }>
  isError?: boolean
  structuredContent?: Record<string, unknown>
}

function writeProject(dir: string, options: { synced: boolean }): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'ui.config.ts'), 'export default {}')
  if (options.synced) {
    mkdirSync(join(dir, '.reference-ui', 'mcp'), { recursive: true })
    writeFileSync(join(dir, '.reference-ui', 'mcp', 'model.json'), JSON.stringify(MINIMAL_ARTIFACT))
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

  it('reports the not-synced error for an explicit unsynced --project', async () => {
    writeProject(join(testDir, 'packages', 'ui'), { synced: false })

    const pm = new ProjectManager(testDir, { project: 'packages/ui' })
    await pm.initialize()
    const res = await runTool(pm)

    expect(res.isError).toBe(true)
    expect(res.content[0]?.text).toContain('has not been synced yet')
    expect(res.content[0]?.text).toContain("Run 'ref sync'")
  })
})
