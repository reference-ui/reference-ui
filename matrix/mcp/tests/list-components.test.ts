import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  connectSharedMatrixMcp,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  stopMcpClient,
  type ComponentSummary,
  type RunningMcpClient,
} from './helpers'

let running: RunningMcpClient | null = null

describe('list_components', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await connectSharedMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('returns compact discovery rows with observed prop previews', async () => {
    const result = await running!.client.callTool({
      name: 'list_components',
      arguments: { query: 'hero' },
    })
    const listed = parseTextJson<{ components: ComponentSummary[] }>(result)

    expect(listed.components).toEqual([
      expect.objectContaining({
        name: 'HeroBanner',
        source: './components/index.tsx',
        interfaceName: 'HeroBannerProps',
        observedProps: expect.arrayContaining(['body', 'ctaHref', 'ctaLabel', 'heading']),
        propCount: 4,
        styleProps: expect.objectContaining({ tool: 'get_style_props' }),
      }),
    ])
  })
})
