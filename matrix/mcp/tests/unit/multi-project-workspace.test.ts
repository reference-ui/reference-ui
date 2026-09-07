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

interface ListProjectsResult {
  activeProject: string | null
  projects: Array<{
    path: string
    configPath: string
    source: string
    hasArtifacts: boolean
    isDefault: boolean
  }>
  sanitizedStaleCount: number
}

describe('multi-project workspace & switching', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  const rawTestDir = join(tmpdir(), `ref-mcp-multi-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(rawTestDir, { recursive: true })
  const testDir = realpathSync(rawTestDir)
  let runningServer: RunningMcpServer | null = null
  let runningClient: RunningMcpClient | null = null
  let packages: Record<string, string> = {}

  beforeAll(async () => {
    packages = createMultiProjectWorkspace(testDir, {
      alpha: {
        components: [
          { name: 'AlphaButton', props: ['variant', 'size'] },
          { name: 'AlphaCard', props: ['elevation'] },
        ],
        hasArtifacts: true,
      },
      beta: {
        components: [
          { name: 'BetaModal', props: ['isOpen', 'onClose'] },
          { name: 'BetaTable', props: ['columns', 'data'] },
        ],
        hasArtifacts: true,
      },
      'gamma-unsynced': {
        hasArtifacts: false,
      },
      'delta-broken': {
        brokenConfig: true,
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

  it('discovers all workspace projects and correctly reports artifact presence', async () => {
    const listRes = await runningClient!.client.callTool({
      name: 'list_projects',
      arguments: {},
    })
    const list = parseTextJson<ListProjectsResult>(listRes)

    expect(list.projects.length).toBeGreaterThanOrEqual(4)

    const alphaEntry = list.projects.find(p => p.path === packages.alpha)
    expect(alphaEntry).toBeDefined()
    expect(alphaEntry?.hasArtifacts).toBe(true)

    const betaEntry = list.projects.find(p => p.path === packages.beta)
    expect(betaEntry).toBeDefined()
    expect(betaEntry?.hasArtifacts).toBe(true)

    const gammaEntry = list.projects.find(p => p.path === packages['gamma-unsynced'])
    expect(gammaEntry).toBeDefined()
    expect(gammaEntry?.hasArtifacts).toBe(false)
  })

  it('selects project alpha and retrieves alpha components only', async () => {
    const selectRes = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: packages.alpha },
    })
    const selectData = parseTextJson<{ status: string; project: string }>(selectRes)
    expect(selectData.status).toBe('active')
    expect(selectData.project).toBe(packages.alpha)

    const compRes = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: {},
    })
    const compData = parseTextJson<{ components: ComponentSummary[] }>(compRes)
    const names = compData.components.map(c => c.name)

    expect(names).toContain('AlphaButton')
    expect(names).toContain('AlphaCard')
    expect(names).not.toContain('BetaModal')
    expect(names).not.toContain('BetaTable')
  })

  it('switches to project beta and retrieves beta components only (no bleed-through)', async () => {
    const selectRes = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: packages.beta },
    })
    const selectData = parseTextJson<{ status: string; project: string }>(selectRes)
    expect(selectData.status).toBe('active')
    expect(selectData.project).toBe(packages.beta)

    const compRes = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: {},
    })
    const compData = parseTextJson<{ components: ComponentSummary[] }>(compRes)
    const names = compData.components.map(c => c.name)

    expect(names).toContain('BetaModal')
    expect(names).toContain('BetaTable')
    expect(names).not.toContain('AlphaButton')
    expect(names).not.toContain('AlphaCard')
  })

  it('allows targeting alpha via per-query project parameter while beta remains active', async () => {
    // Active project is currently beta
    const result = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: { project: packages.alpha },
    })
    const data = parseTextJson<{ components: ComponentSummary[]; activeProject: string }>(result)
    const names = data.components.map(c => c.name)

    expect(names).toContain('AlphaButton')
    expect(names).not.toContain('BetaModal')
    // Active project should still be beta
    expect(data.activeProject).toBe(packages.beta)
  })

  it('handles rapid consecutive project switches without cache corruption', async () => {
    for (let i = 0; i < 4; i++) {
      const target = i % 2 === 0 ? packages.alpha : packages.beta
      const expectedComponent = i % 2 === 0 ? 'AlphaButton' : 'BetaModal'

      await runningClient!.client.callTool({
        name: 'select_project',
        arguments: { path: target },
      })

      const res = await runningClient!.client.callTool({
        name: 'list_components',
        arguments: {},
      })
      const data = parseTextJson<{ components: ComponentSummary[] }>(res)
      expect(data.components.some(c => c.name === expectedComponent)).toBe(true)
    }
  })

  it('returns clean actionable error when selecting unsynced project without crashing', async () => {
    const selectRes = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: packages['gamma-unsynced'] },
    })
    expect(selectRes.isError).toBeFalsy()

    // Now query components on the unsynced project
    const compRes = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: {},
    })
    expect(compRes.isError).toBe(true)
    const errorText = (compRes.content as Array<{ text: string }>)[0]?.text ?? ''
    expect(errorText.toLowerCase()).toContain('sync')

    // Server should still be responsive — can switch back to alpha
    const recoveryRes = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: packages.alpha },
    })
    expect(recoveryRes.isError).toBeFalsy()
  })
})
