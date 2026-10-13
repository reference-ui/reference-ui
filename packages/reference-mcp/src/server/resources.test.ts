import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js'
import { notSyncedMessage } from './project-context'
import { ProjectManager } from './project-manager'
import { GlobalProjectRegistry } from './project-registry'
import { REFERENCE_MCP_COMPONENT_MODEL_URI } from './resources'
import { createReferenceMcpServer } from './server-factory'

// Build children are stubbed: a project with generated types builds its model, and one without
// fails the way a real project does. Same stub as tools.test.ts.
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

/** The text of a resource read's first entry. The component model is served as text. */
function textOf(res: ReadResourceResult): string {
  const entry = res.contents[0]
  if (!entry || !('text' in entry)) throw new Error('expected a text resource')
  return entry.text
}

describe('component-model resource sync re-check', () => {
  let testDir: string
  let synced: string
  let savedRefProject: string | undefined
  let projectManager: ProjectManager
  let client: Client
  let closeConnection: () => Promise<void> = async () => {}

  beforeEach(async () => {
    const rawTestDir = join(tmpdir(), `ref-test-resources-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(rawTestDir, { recursive: true })
    testDir = realpathSync(rawTestDir)
    GlobalProjectRegistry.setRegistryPathForTesting(join(testDir, 'registry.json'))
    savedRefProject = process.env.REF_PROJECT
    delete process.env.REF_PROJECT

    writeFileSync(join(testDir, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n")
    synced = join(testDir, 'packages', 'ui')
    writeProject(synced, { synced: true })

    projectManager = new ProjectManager(testDir)
    await projectManager.initialize()
    const server = createReferenceMcpServer({ cwd: testDir, projectManager })
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await server.connect(serverTransport)
    client = new Client({ name: 'reference-mcp-resources-test', version: '0.0.0' })
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

  it('serves the model of the synced default project', async () => {
    const res = await client.readResource({ uri: REFERENCE_MCP_COMPONENT_MODEL_URI })
    expect(res.contents[0]).toMatchObject({
      uri: REFERENCE_MCP_COMPONENT_MODEL_URI,
      mimeType: 'application/json',
    })
    expect(JSON.parse(textOf(res))).toMatchObject({ schemaVersion: 1, components: [] })
  })

  it('fails the read with the not-synced message once the artifacts are gone, as the tools do', async () => {
    // The first read builds and caches the model, so the next read would answer from cache if unchecked.
    await client.readResource({ uri: REFERENCE_MCP_COMPONENT_MODEL_URI })
    const invalidate = vi.spyOn(projectManager, 'invalidateProject')

    rmSync(join(synced, '.reference-ui'), { recursive: true, force: true })
    await expect(client.readResource({ uri: REFERENCE_MCP_COMPONENT_MODEL_URI })).rejects.toThrow(
      notSyncedMessage(synced)
    )
    expect(invalidate).toHaveBeenCalledWith(synced)
  })

  it('serves the rebuilt model after a re-sync, without a server restart', async () => {
    await client.readResource({ uri: REFERENCE_MCP_COMPONENT_MODEL_URI })
    rmSync(join(synced, '.reference-ui'), { recursive: true, force: true })
    await expect(client.readResource({ uri: REFERENCE_MCP_COMPONENT_MODEL_URI })).rejects.toThrow(
      notSyncedMessage(synced)
    )

    // A re-sync writes the manifest again; the dropped cache is rebuilt on the next read.
    writeProject(synced, { synced: true })
    const restored = await client.readResource({ uri: REFERENCE_MCP_COMPONENT_MODEL_URI })
    expect(JSON.parse(textOf(restored))).toMatchObject({ schemaVersion: 1 })
  })
})
