import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdirSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  connectMcpClient,
  createMultiProjectWorkspace,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  startMcpServer,
  stopMcpClient,
  stopMcpServer,
  type ComponentSummary,
  type RunningMcpClient,
  type RunningMcpServer,
} from './helpers'

describe('project failure modes & fault isolation', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  const rawTestDir = join(tmpdir(), `ref-mcp-failures-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(rawTestDir, { recursive: true })
  const testDir = realpathSync(rawTestDir)
  let runningServer: RunningMcpServer | null = null
  let runningClient: RunningMcpClient | null = null
  let packages: Record<string, string> = {}

  beforeAll(async () => {
    packages = createMultiProjectWorkspace(testDir, {
      healthy: {
        components: [{ name: 'HealthyButton' }],
        hasArtifacts: true,
      },
      'syntax-error-config': {
        brokenConfig: true,
        hasArtifacts: false,
      },
      'corrupted-artifact': {
        invalidJsonArtifact: true,
        hasArtifacts: true,
      },
      'missing-artifacts': {
        hasArtifacts: false,
      },
    })

    runningServer = await startMcpServer(testDir, 0, {
      env: { HOME: testDir },
    })
    runningClient = await connectMcpClient(runningServer.serverUrl)
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    if (runningClient) {
      await stopMcpClient(runningClient)
      runningClient = null
    }
    if (runningServer) {
      await stopMcpServer(runningServer)
      runningServer = null
    }
    rmSync(testDir, { recursive: true, force: true })
  }, 10_000)

  it('serves healthy project as expected', async () => {
    await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: packages.healthy },
    })

    const compRes = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: {},
    })
    expect(compRes.isError).toBeFalsy()
    const data = parseTextJson<{ components: ComponentSummary[] }>(compRes)
    expect(data.components.some(c => c.name === 'HealthyButton')).toBe(true)
  })

  it('handles querying missing-artifacts project with actionable error without crashing', async () => {
    const res = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: { project: packages['missing-artifacts'] },
    })
    expect(res.isError).toBe(true)
    const errText = (res.content as Array<{ text: string }>)[0]?.text ?? ''
    expect(errText.toLowerCase()).toContain('sync')

    // Healthy project must still be fully functional immediately after
    const healthyRes = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: { project: packages.healthy },
    })
    expect(healthyRes.isError).toBeFalsy()
  })

  it('handles project with broken ui.config.ts without taking down the server', async () => {
    const res = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: { project: packages['syntax-error-config'] },
    })
    expect(res.isError).toBe(true)

    // Verify the server is still alive and responsive
    const pingRes = await runningClient!.client.callTool({
      name: 'list_projects',
      arguments: {},
    })
    expect(pingRes.isError).toBeFalsy()
  })

  it('handles project with corrupted model.json artifact without crashing', async () => {
    const res = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: { project: packages['corrupted-artifact'] },
    })
    // It should handle JSON parse error gracefully
    expect(res).toBeDefined()

    // Healthy project must still work
    const healthyRes = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: { project: packages.healthy },
    })
    expect(healthyRes.isError).toBeFalsy()
  })
})
