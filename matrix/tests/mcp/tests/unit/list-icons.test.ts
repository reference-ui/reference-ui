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

  it('searches icons by query and returns matching icons with export names and descriptions', async () => {
    const result = await running!.client.callTool({
      name: 'list_icons',
      arguments: { query: 'arrow' },
    })
    saveResponse('list_icons', 'query-arrow', result)
    const data = parseTextJson<{
      total: number
      returned: number
      icons: Array<{ name: string; description: string }>
    }>(result)

    expect(data.returned).toBeGreaterThan(0)
    expect(
      data.icons.every(
        icon =>
          icon.name.toLowerCase().includes('arrow') ||
          icon.description.toLowerCase().includes('arrow')
      )
    ).toBe(true)
    expect(data.icons[0]).toHaveProperty('name')
    expect(data.icons[0]).toHaveProperty('description')
  })

  it('searches semantically by keyword: "trash" returns DeleteIcon with lean payload', async () => {
    const result = await running!.client.callTool({
      name: 'list_icons',
      arguments: { query: 'trash' },
    })
    saveResponse('list_icons', 'query-trash', result)
    const data = parseTextJson<{
      total: number
      returned: number
      icons: Array<{ name: string; description: string; import?: string; example?: string }>
    }>(result)

    expect(data.returned).toBeGreaterThan(0)
    expect(data.icons[0].name).toBe('DeleteIcon')
    expect(data.icons[0].description).toContain('Delete')
    // Lean output: import and example omitted by default to conserve tokens
    expect(data.icons[0].import).toBeUndefined()
    expect(data.icons[0].example).toBeUndefined()
  })

  it('supports verbose=true to return import statement and example when explicitly requested', async () => {
    const result = await running!.client.callTool({
      name: 'list_icons',
      arguments: { query: 'trash', verbose: true },
    })
    saveResponse('list_icons', 'query-trash-verbose', result)
    const data = parseTextJson<{
      total: number
      returned: number
      icons: Array<{ name: string; description: string; import: string; example: string }>
    }>(result)

    expect(data.returned).toBeGreaterThan(0)
    expect(data.icons[0].name).toBe('DeleteIcon')
    expect(data.icons[0].import).toBe("import { DeleteIcon } from '@reference-ui/icons'")
    expect(data.icons[0].example).toContain('<DeleteIcon size="md"')
  })

  it('resolves multi-demand natural language sentences in a single tool call', async () => {
    const result = await running!.client.callTool({
      name: 'list_icons',
      arguments: {
        query: 'I need an icon for user settings, a shopping cart, and a trash can',
      },
    })
    saveResponse('list_icons', 'query-sentence-demands', result)
    const data = parseTextJson<{
      totalDemands: number
      demands: Array<{ demand: string; icons: Array<{ name: string; description: string }> }>
      icons: Array<{ name: string; description: string }>
    }>(result)

    expect(data.totalDemands).toBe(3)
    expect(data.demands).toHaveLength(3)
    expect(data.icons.some(i => i.name.includes('Settings'))).toBe(true)
    expect(data.icons.some(i => i.name.includes('Cart'))).toBe(true)
    expect(data.icons.some(i => i.name.includes('Delete'))).toBe(true)
  })

  it('resolves explicit batch demands array in a single tool call', async () => {
    const result = await running!.client.callTool({
      name: 'list_icons',
      arguments: {
        demands: ['shopping cart', 'trash'],
      },
    })
    saveResponse('list_icons', 'batch-demands', result)
    const data = parseTextJson<{
      totalDemands: number
      demands: Array<{ demand: string; icons: Array<{ name: string; description: string }> }>
      icons: Array<{ name: string; description: string }>
    }>(result)

    expect(data.totalDemands).toBe(2)
    expect(data.demands[0].icons.some(i => i.name === 'ShoppingCartIcon')).toBe(true)
    expect(data.demands[1].icons.some(i => i.name === 'DeleteIcon')).toBe(true)
  })

  it('returns instructional guidance and 0 icons when called without query or category', async () => {
    const result = await running!.client.callTool({
      name: 'list_icons',
      arguments: {},
    })
    saveResponse('list_icons', 'no-query-guidance', result)
    const data = parseTextJson<{
      totalAvailable: number
      message: string
      categories: string[]
      examples: string[]
      total: number
      returned: number
      icons: unknown[]
    }>(result)

    expect(data.totalAvailable).toBeGreaterThan(3000)
    expect(data.total).toBe(0)
    expect(data.returned).toBe(0)
    expect(data.icons).toHaveLength(0)
    expect(data.message).toContain('3,800+ Material Symbols React icons')
    expect(data.categories.length).toBeGreaterThan(5)
  })

  it('returns disabled notice when project has use_reference_icons: false', async () => {
    const rawTmpDir = join(
      tmpdir(),
      `ref-mcp-icons-${Date.now()}-${Math.random().toString(36).slice(2)}`
    )
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
