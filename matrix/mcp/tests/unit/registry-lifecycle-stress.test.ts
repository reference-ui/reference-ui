import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
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

describe('registry lifecycle, deletion & self-healing', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  const rawTestDir = join(tmpdir(), `ref-mcp-registry-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(rawTestDir, { recursive: true })
  const testDir = realpathSync(rawTestDir)
  const isolatedRegistryFile = join(testDir, 'isolated-registry.json')
  let runningServer: RunningMcpServer | null = null
  let runningClient: RunningMcpClient | null = null
  let packages: Record<string, string> = {}

  beforeAll(async () => {
    mkdirSync(testDir, { recursive: true })

    packages = createMultiProjectWorkspace(testDir, {
      alpha: {
        components: [{ name: 'AlphaButton' }],
        hasArtifacts: true,
      },
      beta: {
        components: [{ name: 'BetaModal' }],
        hasArtifacts: true,
      },
      ephemeral: {
        components: [{ name: 'EphemeralItem' }],
        hasArtifacts: true,
      },
    })

    runningServer = await startMcpServer(testDir, 0, {
      env: {
        HOME: testDir,
        REF_REGISTRY_PATH: isolatedRegistryFile,
      },
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

  it('updates global registry when select_project is called', async () => {
    const res = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: packages.alpha },
    })
    expect(res.isError).toBeFalsy()

    // Verify that the registry file has been created and contains alpha
    expect(existsSync(isolatedRegistryFile)).toBe(true)
    const raw = JSON.parse(readFileSync(isolatedRegistryFile, 'utf8')) as {
      projects: Record<string, { configPath: string; lastActive: string }>
    }

    expect(raw.projects).toBeDefined()
    expect(raw.projects[packages.alpha]).toBeDefined()
    expect(typeof raw.projects[packages.alpha].lastActive).toBe('string')
  })

  it('sanitizes deleted projects from the registry and reports sanitized count', async () => {
    // 1. First, select the ephemeral project so it is recorded in the registry
    await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: packages.ephemeral },
    })

    // Confirm it is registered
    const beforeRaw = JSON.parse(readFileSync(isolatedRegistryFile, 'utf8')) as {
      projects: Record<string, unknown>
    }
    expect(beforeRaw.projects[packages.ephemeral]).toBeDefined()

    // 2. Delete the ephemeral project from disk
    rmSync(packages.ephemeral, { recursive: true, force: true })

    // 3. Call list_projects, which should sanitize the registry
    const listRes = await runningClient!.client.callTool({
      name: 'list_projects',
      arguments: {},
    })
    expect(listRes.isError).toBeFalsy()
    const listData = parseTextJson<ListProjectsResult>(listRes)

    // sanitizedStaleCount should report at least 1 sanitized project
    expect(listData.sanitizedStaleCount).toBeGreaterThanOrEqual(1)

    // The deleted project must not appear in discovered projects
    expect(listData.projects.some(p => p.path === packages.ephemeral)).toBe(false)

    // The registry file on disk should no longer contain the ephemeral project
    const afterRaw = JSON.parse(readFileSync(isolatedRegistryFile, 'utf8')) as {
      projects: Record<string, unknown>
    }
    expect(afterRaw.projects[packages.ephemeral]).toBeUndefined()
  })

  it('gracefully handles active project deletion without wedging the server', async () => {
    // 1. Create another disposable project and select it
    const disposableDir = join(testDir, 'packages', 'disposable')
    mkdirSync(disposableDir, { recursive: true })
    writeFileSync(join(disposableDir, 'ui.config.ts'), 'export default {}')

    await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: disposableDir },
    })

    // 2. Delete the active project while it is active!
    rmSync(disposableDir, { recursive: true, force: true })

    // 3. Calling list_components should NOT hang for 30s or throw unhandled spawn crash
    const compRes = await runningClient!.client.callTool({
      name: 'list_components',
      arguments: {},
    })
    // Server handled it gracefully (either falling back to universal mode or returning clean error)
    expect(compRes).toBeDefined()

    // 4. Server must remain fully operational — able to list and select beta
    const recoverRes = await runningClient!.client.callTool({
      name: 'select_project',
      arguments: { path: packages.beta },
    })
    expect(recoverRes.isError).toBeFalsy()
  })

  it('recovers cleanly when the registry file is corrupted with invalid JSON', async () => {
    // Corrupt the registry file intentionally
    writeFileSync(isolatedRegistryFile, '{ this is corrupted json @@#!', 'utf8')

    // Calling list_projects must not crash the server
    const listRes = await runningClient!.client.callTool({
      name: 'list_projects',
      arguments: {},
    })
    expect(listRes.isError).toBeFalsy()

    // A backup file (.bak) should be created
    expect(existsSync(`${isolatedRegistryFile}.bak`)).toBe(true)
  })
})
