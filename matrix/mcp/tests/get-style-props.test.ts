import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  connectSharedMatrixMcp,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  stopMcpClient,
  type RunningMcpClient,
} from './helpers'

let running: RunningMcpClient | null = null

describe('get_style_props', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await connectSharedMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('returns the shared style prop reference and token category mapping', async () => {
    const result = await running!.client.callTool({
      name: 'get_style_props',
      arguments: { query: 'color' },
    })
    const styleProps = parseTextJson<{
      categories: Array<{ name: string; tokenCategories: string[] }>
      description: string
      tokenGuidance: string
    }>(result)

    expect(styleProps.description).toContain('StyleProps')
    expect(styleProps.tokenGuidance).toContain('get_tokens')
    expect(styleProps.categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'color',
          tokenCategories: expect.arrayContaining(['colors']),
        }),
      ]),
    )
  })

  it('returns an exact focused lookup for the r prop', async () => {
    const result = await running!.client.callTool({
      name: 'get_style_props',
      arguments: { query: 'r', includeProps: true },
    })
    const styleProps = parseTextJson<{
      categories: Array<{ name: string; props: string[] }>
      matchedProp?: string
    }>(result)

    expect(styleProps.matchedProp).toBe('r')
    expect(styleProps.categories).toEqual([
      expect.objectContaining({
        name: 'reference-ui',
        props: ['r'],
      }),
    ])
  })
})
