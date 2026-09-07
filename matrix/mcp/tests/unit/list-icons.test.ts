import { mkdirSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  connectSharedMatrixMcp,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  saveResponse,
  stopMcpClient,
  writeMockProject,
  type RunningMcpClient,
} from './helpers'

let running: RunningMcpClient | null = null

describe('list_icons', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await connectSharedMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('searches icons by query and returns matching icons with export names', async () => {
    const result = await running!.client.callTool({
      name: 'list_icons',
      arguments: { query: 'arrow' },
    })
    saveResponse('list_icons', 'query-arrow', result)
    const data = parseTextJson<{
      total: number
      returned: number
      icons: Array<{ name: string; import: string; example: string }>
    }>(result)

    expect(data.returned).toBeGreaterThan(0)
    expect(data.icons.every(icon => icon.name.toLowerCase().includes('arrow'))).toBe(true)
    expect(data.icons[0]).toHaveProperty('name')
    expect(data.icons[0]).toHaveProperty('import')
    expect(data.icons[0]).toHaveProperty('example')
  })

  it('lists icons without query up to the specified limit', async () => {
    const result = await running!.client.callTool({
      name: 'list_icons',
      arguments: { limit: 10 },
    })
    saveResponse('list_icons', 'limit-10', result)
    const data = parseTextJson<{
      total: number
      returned: number
      icons: Array<{ name: string; import: string; example: string }>
    }>(result)

    expect(data.total).toBeGreaterThan(10)
    expect(data.returned).toBe(10)
    expect(data.icons).toHaveLength(10)
  })

  it('returns disabled notice when project has use_reference_icons: false', async () => {
    const rawTmpDir = join(tmpdir(), `ref-mcp-icons-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(rawTmpDir, { recursive: true })
    const tmpDir = realpathSync(rawTmpDir)

    try {
      writeMockProject(tmpDir, { useReferenceIcons: false })
      const result = await running!.client.callTool({
        name: 'list_icons',
        arguments: { project: tmpDir },
      })
      saveResponse('list_icons', 'disabled-icons', result)
      const data = parseTextJson<{
        enabled: boolean
        notice: string
        total: number
        returned: number
        icons: unknown[]
      }>(result)

      expect(data.enabled).toBe(false)
      expect(data.notice).toContain('use_reference_icons: false')
      expect(data.icons).toHaveLength(0)
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
