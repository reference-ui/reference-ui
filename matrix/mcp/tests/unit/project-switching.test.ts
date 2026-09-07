import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  connectSharedMatrixMcp,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  saveResponse,
  stopMcpClient,
  type ComponentSummary,
  type RunningMcpClient,
} from './helpers'

let running: RunningMcpClient | null = null

describe('per-query project targeting', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await connectSharedMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('queries components using explicit project parameter', async () => {
    const listProj = await running!.client.callTool({
      name: 'list_projects',
      arguments: {},
    })
    const parsed = parseTextJson<{ activeProject: string | null }>(listProj)
    expect(parsed.activeProject).toBeTruthy()

    const result = await running!.client.callTool({
      name: 'list_components',
      arguments: {
        project: parsed.activeProject!,
        query: 'hero',
      },
    })
    saveResponse('list_components', 'explicit-project', result)
    const data = parseTextJson<{ components: ComponentSummary[] }>(result)
    expect(data.components.length).toBeGreaterThan(0)
    expect(data.components.some(c => c.name === 'HeroBanner')).toBe(true)
  })

  it('queries single component using explicit project parameter', async () => {
    const listProj = await running!.client.callTool({
      name: 'list_projects',
      arguments: {},
    })
    const parsed = parseTextJson<{ activeProject: string | null }>(listProj)

    const result = await running!.client.callTool({
      name: 'get_component',
      arguments: {
        name: 'HeroBanner',
        project: parsed.activeProject!,
      },
    })
    saveResponse('get_component', 'explicit-project', result)
    const comp = parseTextJson<ComponentSummary>(result)
    expect(comp.name).toBe('HeroBanner')
  })

  it('returns structured error when explicit project does not exist without crashing server', async () => {
    const result = await running!.client.callTool({
      name: 'get_component',
      arguments: {
        name: 'HeroBanner',
        project: 'non/existent/path',
      },
    })
    expect(result.isError).toBe(true)
  })
})
