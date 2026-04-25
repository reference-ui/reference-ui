import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  findTextContent,
  findTextResource,
  referenceUnitRoot,
  startMcpClient,
  stopMcpClient,
  type RunningMcpClient,
} from './helpers'

const serverUrl = new URL('http://127.0.0.1:3697/mcp')

let running: RunningMcpClient | null = null

describe('mcp server', { timeout: 120_000 }, () => {
  beforeAll(async () => {
    running = await startMcpClient(referenceUnitRoot, 3697)
    expect(running.serverUrl.href).toBe(serverUrl.href)
  }, 120_000)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('serves the expected tools and component model over HTTP on port 3697', async () => {
    expect(running).not.toBeNull()

    const tools = await running!.client.listTools()
    const toolNames = tools.tools.map(tool => tool.name).sort()

    expect(toolNames).toEqual([
      'get_component',
      'get_component_examples',
      'get_component_props',
      'get_style_props',
      'get_tokens',
      'getting_started',
      'list_components',
    ])

    const resource = await running!.client.readResource({
      uri: 'reference-ui://component-model',
    })
    const modelJson = findTextResource(resource)

    expect(modelJson).toBeDefined()
    expect(modelJson?.mimeType).toBe('application/json')
    expect(modelJson?.text).toContain('"schemaVersion"')
    expect(modelJson?.text).toContain('"components"')
    expect(modelJson?.text).not.toContain('"workspaceRoot"')
    expect(modelJson?.text).not.toContain('"manifestPath"')
    expect(modelJson?.text).not.toContain('"diagnostics"')
    expect(modelJson?.text).not.toContain('"props"')

    const gettingStarted = await running!.client.readResource({
      uri: 'reference-ui://getting-started',
    })
    const gettingStartedText = findTextResource(gettingStarted)

    expect(gettingStartedText?.mimeType).toBe('text/markdown')
    expect(gettingStartedText?.text).toContain('Reference UI Start Guide')

    const gettingStartedTool = await running!.client.callTool({
      name: 'getting_started',
      arguments: {},
    })
    const gettingStartedToolText = findTextContent(gettingStartedTool)

    expect(gettingStartedToolText).toContain('Reference UI Start Guide')
    expect(gettingStartedToolText).toContain('@reference-ui/react')

    const listComponentsResult = await running!.client.callTool({
      name: 'list_components',
      arguments: {},
    })
    const responseText = findTextContent(listComponentsResult)

    expect(responseText).toBeDefined()
    expect(responseText).toContain('"components"')
  })
})
