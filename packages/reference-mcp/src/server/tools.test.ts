import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createReferenceMcpServer } from './server-factory'
import { ProjectManager } from './project-manager'
import { GlobalProjectRegistry } from './project-registry'

// Build children are stubbed: a project with generated types builds its model, and one without
// fails the way a real project does.
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

const PROJECT_SCOPED_TOOLS = [
  'list_components',
  'get_component',
  'get_component_props',
  'get_component_examples',
  'get_tokens',
  'list_icons',
  'get_style_props',
]

/** A project with ui.config.ts; `synced` also writes the types manifest that `ref sync` produces. */
function writeProject(dir: string, options: { synced: boolean }): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'ui.config.ts'), 'export default {}')
  if (options.synced) {
    mkdirSync(join(dir, '.reference-ui', 'types', 'tasty'), { recursive: true })
    writeFileSync(join(dir, '.reference-ui', 'types', 'tasty', 'manifest.js'), 'export {}\n')
  }
}

describe('reference tools over MCP', () => {
  let testDir: string
  let synced: string
  let unsynced: string
  let savedRefProject: string | undefined
  let client: Client
  let closeConnection: () => Promise<void> = async () => {}

  beforeEach(async () => {
    const rawTestDir = join(tmpdir(), `ref-test-tools-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(rawTestDir, { recursive: true })
    testDir = realpathSync(rawTestDir)
    GlobalProjectRegistry.setRegistryPathForTesting(join(testDir, 'registry.json'))
    savedRefProject = process.env.REF_PROJECT
    delete process.env.REF_PROJECT

    writeFileSync(join(testDir, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")
    synced = join(testDir, 'packages', 'synced')
    unsynced = join(testDir, 'packages', 'unsynced')
    writeProject(synced, { synced: true })
    writeProject(unsynced, { synced: false })

    const projectManager = new ProjectManager(testDir)
    await projectManager.initialize()
    const server = createReferenceMcpServer({ cwd: testDir, projectManager })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await server.connect(serverTransport)
    client = new Client({ name: 'reference-mcp-tools-test', version: '0.0.0' })
    await client.connect(clientTransport)
    closeConnection = async () => {
      await client.close()
      await server.close()
    }
  })

  afterEach(async () => {
    await closeConnection()
    GlobalProjectRegistry.setRegistryPathForTesting(null)
    if (savedRefProject === undefined) delete process.env.REF_PROJECT
    else process.env.REF_PROJECT = savedRefProject
    rmSync(testDir, { recursive: true, force: true })
  })

  it('select_project advertises path and project as optional string fields', async () => {
    const { tools } = await client.listTools()
    const tool = tools.find(t => t.name === 'select_project')
    expect(tool?.inputSchema.properties).toHaveProperty('path')
    expect(tool?.inputSchema.properties).toHaveProperty('project')
    expect(tool?.inputSchema.required ?? []).toEqual([])
  })

  it('select_project accepts the path shape', async () => {
    const res = await client.callTool({ name: 'select_project', arguments: { path: synced } })
    expect(res.isError).toBeFalsy()
    expect(res.structuredContent).toMatchObject({ status: 'active', project: synced })
  })

  it('select_project accepts the per-query project shape', async () => {
    const res = await client.callTool({
      name: 'select_project',
      arguments: { project: 'packages/synced' },
    })
    expect(res.isError).toBeFalsy()
    expect(res.structuredContent).toMatchObject({ status: 'active', project: synced })
  })

  it('select_project uses path when both are passed', async () => {
    const res = await client.callTool({
      name: 'select_project',
      arguments: { path: 'packages/synced', project: 'packages/unsynced' },
    })
    expect(res.isError).toBeFalsy()
    expect(res.structuredContent).toMatchObject({ project: synced })
  })

  it('select_project rejects a call with neither path nor project', async () => {
    const res = await client.callTool({ name: 'select_project', arguments: {} })
    expect(res.isError).toBe(true)
    expect(JSON.stringify(res.content)).toContain('select_project needs a project directory')
  })

  it.each([
    ['a non-string path', { path: 42 }],
    ['a non-string project', { project: ['packages/synced'] }],
    ['an empty path', { path: '' }],
    ['an empty project', { project: '' }],
  ])('select_project rejects %s', async (_label, args) => {
    const res = await client.callTool({ name: 'select_project', arguments: args })
    expect(res.isError).toBe(true)
    expect(JSON.stringify(res.content)).toContain('Invalid arguments for tool select_project')
  })

  it('select_project reports the not-synced error for an unsynced project, not a loading status', async () => {
    const res = await client.callTool({ name: 'select_project', arguments: { path: unsynced } })
    expect(res.isError).toBe(true)
    expect(res.structuredContent).toBeUndefined()
    expect(JSON.stringify(res.content)).toContain('has not been synced yet')
    expect(JSON.stringify(res.content)).toContain("Run 'ref sync'")
  })

  it('a project-scoped call after selecting an unsynced project gives the same not-synced error', async () => {
    await client.callTool({ name: 'select_project', arguments: { path: unsynced } })
    const res = await client.callTool({ name: 'list_components', arguments: {} })
    expect(res.isError).toBe(true)
    expect(JSON.stringify(res.content)).toContain('has not been synced yet')
  })

  it.each(PROJECT_SCOPED_TOOLS)('%s advertises a per-query project field', async name => {
    const { tools } = await client.listTools()
    const tool = tools.find(t => t.name === name)
    expect(tool?.inputSchema.properties, name).toHaveProperty('project')
  })

  it('get_style_props accepts a per-query project and returns the shared guide', async () => {
    const bare = await client.callTool({ name: 'get_style_props', arguments: {} })
    const scoped = await client.callTool({
      name: 'get_style_props',
      arguments: { project: 'packages/synced' },
    })
    const unknown = await client.callTool({
      name: 'get_style_props',
      arguments: { project: 'packages/missing' },
    })

    expect(bare.isError).toBeFalsy()
    expect(bare.structuredContent).toMatchObject({ categories: expect.any(Array) })
    expect(scoped.isError).toBeFalsy()
    expect(scoped.structuredContent).toEqual(bare.structuredContent)
    expect(unknown.isError).toBeFalsy()
    expect(unknown.structuredContent).toEqual(bare.structuredContent)
  })
})
