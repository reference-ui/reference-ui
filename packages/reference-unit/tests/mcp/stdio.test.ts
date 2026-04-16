import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  findTextContent,
  findTextResource,
  referenceUnitRoot,
  startMcpStdioClient,
  stopMcpStdioClient,
  type RunningMcpStdioClient,
} from './helpers'

let running: RunningMcpStdioClient | null = null

describe('mcp stdio server', { timeout: 120_000 }, () => {
  beforeAll(async () => {
    running = await startMcpStdioClient(referenceUnitRoot)
  }, 30_000)

  afterAll(async () => {
    await stopMcpStdioClient(running)
    running = null
  }, 10_000)

  it('serves the expected tools and public resource shape over stdio', async () => {
    expect(running).not.toBeNull()

    const tools = await running!.client.listTools()
    const toolNames = tools.tools.map(tool => tool.name).sort()

    expect(toolNames).toEqual([
      'get_common_patterns',
      'get_component',
      'get_component_examples',
      'list_components',
    ])

    const resource = await running!.client.readResource({
      uri: 'reference-ui://component-model',
    })
    const modelJson = findTextResource(resource)

    expect(modelJson?.text).toContain('"schemaVersion"')
    expect(modelJson?.text).toContain('"components"')
    expect(modelJson?.text).not.toContain('"workspaceRoot"')
    expect(modelJson?.text).not.toContain('"manifestPath"')
    expect(modelJson?.text).not.toContain('"diagnostics"')

    const listComponentsResult = await running!.client.callTool({
      name: 'list_components',
      arguments: {},
    })

    expect(findTextContent(listComponentsResult)).toContain('"components"')
  })
})
