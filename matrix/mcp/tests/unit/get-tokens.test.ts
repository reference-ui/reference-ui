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

  describe('upstream `_private` tokens (downstream MCP visibility)', () => {
    // matrix/mcp extends @fixtures/extend-library, which authors
    // `colors._private.brand` locally. Because matrix/mcp is downstream of
    // that library, the privacy boundary should hide `_private` from the
    // MCP token surface entirely. The upstream's *public* tokens
    // (e.g. `colors.fixtureDemoAccent`) should still be visible — that
    // proves the upstream fragment was actually loaded, so the absence of
    // `_private` reflects the strip and not a missing extend.

    it('exposes upstream public tokens to the MCP surface', async () => {
      const result = await running!.client.callTool({
        name: 'get_tokens',
        arguments: { query: 'fixtureDemo' },
      })
      const tokenReadout = parseTextJson<TokenReadout>(result)

      expect(tokenReadout.tokens.map(token => token.path)).toEqual(
        expect.arrayContaining([
          'colors.fixtureDemoBg',
          'colors.fixtureDemoText',
          'colors.fixtureDemoAccent',
        ]),
      )
    })

    it('does not return any upstream `_private` token paths', async () => {
      const result = await running!.client.callTool({
        name: 'get_tokens',
        arguments: {},
      })
      const tokenReadout = parseTextJson<TokenReadout>(result)
      const privatePaths = tokenReadout.tokens
        .map(token => token.path)
        .filter(path => path.split('.').includes('_private'))

      expect(privatePaths).toEqual([])
    })

    it('does not return the upstream `_private.brand` token by name', async () => {
      const result = await running!.client.callTool({
        name: 'get_tokens',
        arguments: { query: 'brand' },
      })
      const tokenReadout = parseTextJson<TokenReadout>(result)

      expect(
        tokenReadout.tokens.find(token => token.path === 'colors._private.brand'),
      ).toBeUndefined()
    })

    it('does not return any tokens when querying for `_private`', async () => {
      const result = await running!.client.callTool({
        name: 'get_tokens',
        arguments: { query: '_private' },
      })
      const tokenReadout = parseTextJson<TokenReadout>(result)
      const upstreamPrivatePaths = tokenReadout.tokens
        .map(token => token.path)
        // matrix/mcp authors a local `colors._private.matrixSecret` token
        // which IS visible to its own MCP surface. Filter to upstream-owned
        // private paths only.
        .filter(path => path !== 'colors._private.matrixSecret')

      expect(upstreamPrivatePaths).toEqual([])
    })
  })

  describe('local `_private` tokens (owner MCP visibility)', () => {
    // matrix/mcp authors `colors._private.matrixSecret` in its own
    // src/tokens.ts. Privacy applies to *downstream* consumers, not to the
    // package that owns the token, so the package's MCP surface keeps it.

    it('returns local `_private` tokens authored by the package itself', async () => {
      const result = await running!.client.callTool({
        name: 'get_tokens',
        arguments: { query: 'matrixSecret' },
      })
      const tokenReadout = parseTextJson<TokenReadout>(result)

      expect(tokenReadout.tokens).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: 'colors._private.matrixSecret',
            category: 'colors',
            value: '#abcdef',
          }),
        ]),
      )
    })
  })
})
