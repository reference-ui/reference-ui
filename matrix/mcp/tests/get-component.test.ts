import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  connectSharedMatrixMcp,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  stopMcpClient,
  type ComponentReadout,
  type RunningMcpClient,
} from './helpers'

let running: RunningMcpClient | null = null

describe('get_component', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await connectSharedMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('returns a compact component guide without exhaustive inherited style props', async () => {
    const result = await running!.client.callTool({
      name: 'get_component',
      arguments: { name: 'HeroBanner' },
    })
    const component = parseTextJson<ComponentReadout>(result)

    expect(component.name).toBe('HeroBanner')
    expect(component.interface?.name).toBe('HeroBannerProps')
    expect(component.propSummary).toMatchObject({
      total: 4,
      observed: 4,
      returned: 4,
    })
    expect(component.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'heading', origin: 'observed', styleProp: false, type: 'string' }),
        expect.objectContaining({ name: 'ctaHref', origin: 'observed', styleProp: false, type: 'string' }),
      ]),
    )
    expect(component.styleProps.tool).toBe('get_style_props')
  })
})
