import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  connectSharedMatrixMcp,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  saveResponse,
  stopMcpClient,
  type RunningMcpClient,
} from './helpers'

let running: RunningMcpClient | null = null

interface DiscoveredProjectEntry {
  path: string
  configPath: string
  source: string
  hasArtifacts: boolean
  isDefault: boolean
}

interface ListProjectsResult {
  activeProject: string | null
  projects: DiscoveredProjectEntry[]
  sanitizedStaleCount: number
}

describe('project discovery & selection', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await connectSharedMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('lists active and discovered projects via list_projects', async () => {
    const result = await running!.client.callTool({
      name: 'list_projects',
      arguments: {},
    })
    saveResponse('list_projects', 'default', result)
    const list = parseTextJson<ListProjectsResult>(result)

    expect(list.projects.length).toBeGreaterThan(0)
    const current = list.projects.find(p => p.isDefault)
    expect(current).toBeDefined()
    expect(current?.hasArtifacts).toBe(true)
    expect(typeof list.sanitizedStaleCount).toBe('number')
  })

  it('allows selecting the active project via select_project', async () => {
    const listResult = await running!.client.callTool({
      name: 'list_projects',
      arguments: {},
    })
    const list = parseTextJson<ListProjectsResult>(listResult)
    const active = list.projects.find(p => p.isDefault)
    expect(active).toBeDefined()

    const selectResult = await running!.client.callTool({
      name: 'select_project',
      arguments: { path: active!.path },
    })
    saveResponse('select_project', 'active', selectResult)
    const selected = parseTextJson<{
      status: string
      project: string
      configPath: string
      atlasStatus: string
      componentsCount: number
    }>(selectResult)

    expect(selected.status).toBe('active')
    expect(selected.project).toBe(active!.path)
    expect(selected.atlasStatus).toBe('ready')
    expect(selected.componentsCount).toBeGreaterThan(0)
  })

  it('returns error when selecting non-existent path', async () => {
    const selectResult = await running!.client.callTool({
      name: 'select_project',
      arguments: { path: '/tmp/non-existent-project-path-xyz' },
    })
    expect(selectResult.isError).toBe(true)
  })
})
