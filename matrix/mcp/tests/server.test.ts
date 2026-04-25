import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  MATRIX_MCP_NPX_COMMAND,
  MATRIX_MCP_TIMEOUT_MS,
  startMatrixMcp,
  stopMcpClient,
  type RunningMcpClient,
} from './helpers'

let running: RunningMcpClient | null = null

describe('matrix MCP server', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await startMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('starts the published MCP CLI through npx', async () => {
    expect(process.env.npm_config_registry).toBeTruthy()
    expect(MATRIX_MCP_NPX_COMMAND).toEqual([
      'npx',
      '--yes',
      '--package=@reference-ui/core@latest',
      'mcp',
    ])
    expect(running?.serverUrl.hostname).toBe('127.0.0.1')
    expect(running?.serverUrl.pathname).toBe('/mcp')
  })

  it('exposes the expected MCP tools', async () => {
    const tools = await running!.client.listTools()
    const toolNames = tools.tools.map(tool => tool.name).sort()

    expect(toolNames).toEqual([
      'get_component',
      'get_component_examples',
      'get_component_props',
      'get_style_props',
      'get_tokens',
      'list_components',
    ])
  })
})
