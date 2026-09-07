import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdirSync, realpathSync, rmSync, symlinkSync } from 'node:fs'
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

describe('symlink handling & resilience', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  const rawTestDir = join(tmpdir(), `ref-mcp-symlink-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(rawTestDir, { recursive: true })
  const testDir = realpathSync(rawTestDir)
  let runningServer: RunningMcpServer | null = null
  let runningClient: RunningMcpClient | null = null
  let packages: Record<string, string> = {}
  let symlinkProjectPath: string
  let brokenSymlinkPath: string
  let cycleSymlinkPath: string

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

    // 1. Valid symlinked project directory
    symlinkProjectPath = join(testDir, 'packages', 'alpha-symlink')
    try {
      symlinkSync(packages.alpha, symlinkProjectPath, 'dir')
    } catch {
      // Junction fallback if Windows
      symlinkSync(packages.alpha, symlinkProjectPath, 'junction')
    }

    // 2. Broken / dangling symlink pointing to non-existent target
    brokenSymlinkPath = join(testDir, 'packages', 'broken-symlink')
    try {
      symlinkSync(join(testDir, 'non-existent-target'), brokenSymlinkPath, 'dir')
    } catch {
      symlinkSync(join(testDir, 'non-existent-target'), brokenSymlinkPath, 'junction')
    }

    // 3. Symlink cycle inside alpha directory
    cycleSymlinkPath = join(packages.alpha, 'cycle-link')
    try {
      symlinkSync(packages.alpha, cycleSymlinkPath, 'dir')
    } catch {
      symlinkSync(packages.alpha, cycleSymlinkPath, 'junction')
    }

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

  it('selects project via symlinked directory and resolves canonically', async () => {
    const res = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: symlinkProjectPath },
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ status: string; project: string }>(res)
    expect(data.status).toBe('active')
    // Should resolve to canonical path of alpha
    expect(data.project).toBe(packages.alpha)
  })

  it('queries components using symlinked project path', async () => {
    const res = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: { project: symlinkProjectPath },
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ components: ComponentSummary[] }>(res)
    expect(data.components.some(c => c.name === 'AlphaButton')).toBe(true)
  })

  it('gracefully handles broken dangling symlinks during list_projects without crashing', async () => {
    const res = await runningClient!.client.callTool({
      name: 'list_projects',
      arguments: {},
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ projects: Array<{ path: string }> }>(res)
    // Broken symlink must not be included as a valid project
    expect(data.projects.some(p => p.path === brokenSymlinkPath)).toBe(false)
  })

  it('returns clean error when attempting to select a broken symlink', async () => {
    const res = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: brokenSymlinkPath },
    })
    expect(res.isError).toBe(true)
    const errorText = (res.content as Array<{ text: string }>)[0]?.text ?? ''
    expect(errorText).toContain('No project found')
  })

  it('does not get trapped in infinite loop when scanning directory with symlink cycle', async () => {
    // Targeted scan across the packages directory where cycle-link exists
    const res = await runningClient!.client.callTool({
      name: 'list_projects',
      arguments: {
        scanPath: join(testDir, 'packages'),
        maxDepth: 3,
      },
    })
    expect(res.isError).toBeFalsy()
    const data = parseTextJson<{ projects: Array<{ path: string }> }>(res)
    expect(data.projects.length).toBeGreaterThan(0)
  })
})
