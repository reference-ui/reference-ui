import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  startMatrixMcp,
  stopMcpClient,
  type RunningMcpClient,
  type TokenReadout,
} from './helpers'

let running: RunningMcpClient | null = null

describe('get_tokens', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await startMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('returns flattened project tokens with descriptions and color mode values', async () => {
    const result = await running!.client.callTool({
      name: 'get_tokens',
      arguments: { category: 'colors' },
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
})
