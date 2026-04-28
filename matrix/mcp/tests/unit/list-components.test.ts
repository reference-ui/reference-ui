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
        kind: 'project',
        source: './components/index.tsx',
        interfaceName: 'HeroBannerProps',
        observedProps: expect.arrayContaining(['body', 'ctaHref', 'ctaLabel', 'heading']),
        propCount: 4,
        styleProps: expect.objectContaining({ tool: 'get_style_props' }),
      }),
    ])
  })

  it('includes only observed Reference UI primitives', async () => {
    const result = await running!.client.callTool({
      name: 'list_components',
      arguments: { source: '@reference-ui/react', limit: 100 },
    })
    const listed = parseTextJson<{ components: ComponentSummary[] }>(result)
    const names = listed.components.map(component => component.name)

    expect(names.filter(name => name === 'Div')).toHaveLength(1)
    expect(names.filter(name => name === 'Main')).toHaveLength(1)
    expect(names.filter(name => name === 'P')).toHaveLength(1)
    expect(names.filter(name => name === 'Code')).toHaveLength(1)
    expect(names).not.toContain('Canvas')

    const code = listed.components.find(component => component.name === 'Code')
    expect(code).toEqual(
      expect.objectContaining({
        count: expect.any(Number),
        kind: 'primitive',
        source: '@reference-ui/react',
        interfaceName: 'CodeProps',
        styleProps: expect.objectContaining({ supported: true }),
        usageSemantics: expect.objectContaining({
          count: expect.stringContaining('JSX opening-element occurrences'),
        }),
      }),
    )
    expect(code?.count).toBeGreaterThan(0)
  })
})
