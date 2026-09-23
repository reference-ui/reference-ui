import { afterAll, describe, expect, it } from 'vitest'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  connectMcpClient,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  startMcpServer,
  stopMcpServer,
  type ComponentSummary,
  type RunningMcpServer,
} from './helpers'

describe('resilient boot (empty / non-project directory)', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  const emptyDir = join(tmpdir(), `ref-empty-boot-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  let runningServer: RunningMcpServer | null = null

  afterAll(async () => {
    if (runningServer) {
      await stopMcpServer(runningServer)
      runningServer = null
    }
    rmSync(emptyDir, { recursive: true, force: true })
  })

  it('boots cleanly and serves universal primitives when cwd has no ui.config.ts', async () => {
    mkdirSync(emptyDir, { recursive: true })

    // In MCP v1, this crashed immediately during startup.
    // In MCP v2, the server starts successfully in resilient mode.
    runningServer = await startMcpServer(emptyDir, 0, {
      env: { HOME: emptyDir },
    })
    expect(runningServer.serverUrl).toBeDefined()

    const { client, transport } = await connectMcpClient(runningServer.serverUrl)

    try {
      const tools = await client.listTools()
      expect(tools.tools.length).toBe(9)

      const result = await client.callTool({
        name: 'list_components',
        arguments: {},
      })

      const data = parseTextJson<{
        mode?: string
        notice?: string
        components: ComponentSummary[]
      }>(result)

      expect(data.mode).toBe('universal_primitives')
      expect(data.components.length).toBeGreaterThan(0)
      expect(data.components.some(c => c.name === 'Div')).toBe(true)
      expect(data.components.some(c => c.name === 'Button')).toBe(true)
    } finally {
      await Promise.allSettled([client.close(), transport.close()])
    }
  })
})
