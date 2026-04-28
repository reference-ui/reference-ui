import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  connectSharedMatrixMcp,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  stopMcpClient,
  type RunningMcpClient,
  type TokenReadout,
} from './helpers'

let running: RunningMcpClient | null = null

describe('get_tokens', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await connectSharedMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('compresses large default token output without truncating names', async () => {
    const result = await running!.client.callTool({
      name: 'get_tokens',
      arguments: {},
    })
    const tokenReadout = parseTextJson<TokenReadout>(result)

    expect(tokenReadout.compressed).toBe(true)
    expect(tokenReadout.returned).toBe(tokenReadout.total)
    expect(tokenReadout.message).toContain('Token output compressed')
    expect(tokenReadout.tokens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'colors.gray.100',
          category: 'colors',
        }),
      ]),
    )
    expect(
      tokenReadout.tokens.find(token => token.path === 'colors.text'),
    ).not.toHaveProperty('description')
  })

  it('returns flattened project tokens with descriptions and color mode values', async () => {
    const result = await running!.client.callTool({
      name: 'get_tokens',
      arguments: { query: 'colors.text' },
    })
    const tokenReadout = parseTextJson<TokenReadout>(result)

    expect(tokenReadout.tokens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'colors.text',
          category: 'colors',
          value: '#111111',
          dark: '#f5f5f5',
          description: 'Matrix primary text color',
        }),
      ]),
    )
  })

  it('includes tokens inherited from extended base systems', async () => {
    const result = await running!.client.callTool({
      name: 'get_tokens',
      arguments: { query: 'gray.100' },
    })
    const tokenReadout = parseTextJson<TokenReadout>(result)

    expect(tokenReadout.tokens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'colors.gray.100',
          category: 'colors',
        }),
      ]),
    )
  })

  it('filters tokens by query', async () => {
    const result = await running!.client.callTool({
      name: 'get_tokens',
      arguments: { query: 'card' },
    })
    const tokenReadout = parseTextJson<TokenReadout>(result)

    expect(tokenReadout.tokens).toEqual([
      expect.objectContaining({
        path: 'spacing.card',
        description: 'Matrix card spacing',
      }),
    ])
  })

  it('explains absent token categories', async () => {
    const result = await running!.client.callTool({
      name: 'get_tokens',
      arguments: { category: 'breakpoints' },
    })
    const tokenReadout = parseTextJson<TokenReadout>(result)

    expect(tokenReadout.tokens).toEqual([])
    expect(tokenReadout.availableCategories).toEqual(
      expect.arrayContaining(['colors', 'spacing']),
    )
    expect(tokenReadout.message).toContain('No tokens found for category "breakpoints"')
  })
})
