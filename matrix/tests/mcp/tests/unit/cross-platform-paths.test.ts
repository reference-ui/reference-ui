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

describe('cross-platform path resolution & normalization', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  const rawTestDir = join(tmpdir(), `ref-mcp-paths-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(rawTestDir, { recursive: true })
  const testDir = realpathSync(rawTestDir)
  let runningServer: RunningMcpServer | null = null
  let runningClient: RunningMcpClient | null = null
  let packages: Record<string, string> = {}

  beforeAll(async () => {
    packages = createMultiProjectWorkspace(testDir, {
      alpha: {
        components: [{ name: 'AlphaButton' }],
        hasArtifacts: true,
      },
      beta: {
        components: [{ name: 'BetaModal' }],
        hasArtifacts: true,
      },
    })

    // Create a deep subdirectory inside alpha
    mkdirSync(join(packages.alpha, 'src', 'deep', 'nested', 'subfolder'), { recursive: true })

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

  it('resolves project with trailing forward slash', async () => {
    const res = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: 'packages/alpha/' },
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ status: string; project: string }>(res)
    expect(data.status).toBe('active')
    expect(data.project).toBe(packages.alpha)
  })

  it('resolves project with Windows-style backslashes', async () => {
    const res = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: 'packages\\beta' },
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ status: string; project: string }>(res)
    expect(data.status).toBe('active')
    expect(data.project).toBe(packages.beta)
  })

  it('resolves project with Windows-style backslashes and trailing backslash', async () => {
    const res = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: 'packages\\alpha\\' },
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ status: string; project: string }>(res)
    expect(data.status).toBe('active')
    expect(data.project).toBe(packages.alpha)
  })

  it('resolves project with leading ./ prefix', async () => {
    const res = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: './packages/beta' },
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ status: string; project: string }>(res)
    expect(data.status).toBe('active')
    expect(data.project).toBe(packages.beta)
  })

  it('resolves project with parent directory segment (..)', async () => {
    const res = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: 'packages/beta/../alpha' },
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ status: string; project: string }>(res)
    expect(data.status).toBe('active')
    expect(data.project).toBe(packages.alpha)
  })

  it('walks up deep subdirectories to find parent project root', async () => {
    const deepSubdir = join(packages.alpha, 'src', 'deep', 'nested', 'subfolder')
    const res = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: deepSubdir },
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ status: string; project: string }>(res)
    expect(data.status).toBe('active')
    expect(data.project).toBe(packages.alpha)
  })

  it('queries components using project parameter with trailing slash', async () => {
    const res = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: { project: 'packages/beta/' },
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ components: ComponentSummary[] }>(res)
    expect(data.components.some(c => c.name === 'BetaModal')).toBe(true)
  })

  it('queries components using project parameter with backslashes', async () => {
    const res = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: { project: 'packages\\beta' },
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ components: ComponentSummary[] }>(res)
    expect(data.components.some(c => c.name === 'BetaModal')).toBe(true)
  })

  it('returns clean error when path does not exist without crashing', async () => {
    const res = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: 'packages/does-not-exist-at-all' },
    })
    expect(res.isError).toBe(true)
    const errorText = (res.content as Array<{ text: string }>)[0]?.text ?? ''
    expect(errorText).toContain('No project found')
  })
})
