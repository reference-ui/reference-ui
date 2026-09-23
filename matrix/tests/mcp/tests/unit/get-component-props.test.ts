import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  connectSharedMatrixMcp,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  saveResponse,
  stopMcpClient,
  type ComponentReadout,
  type RunningMcpClient,
} from './helpers'

let running: RunningMcpClient | null = null

describe('get_component_props', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await connectSharedMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('returns the exhaustive prop readout for one component', async () => {
    const result = await running!.client.callTool({
      name: 'get_component_props',
      arguments: { name: 'HeroBanner', includeStyleProps: false },
    })
    saveResponse('get_component_props', 'HeroBanner-no-style-props', result)
    const props = parseTextJson<ComponentReadout>(result)

    expect(props.name).toBe('HeroBanner')
    expect(props.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'body', type: 'string' }),
        expect.objectContaining({ name: 'ctaLabel', type: 'string' }),
      ]),
    )
    expect(props.props.every(prop => prop.styleProp !== true)).toBe(true)
  })

  it('filters props by query', async () => {
    const result = await running!.client.callTool({
      name: 'get_component_props',
      arguments: { name: 'HeroBanner', query: 'cta' },
    })
    saveResponse('get_component_props', 'HeroBanner-query-cta', result)
    const props = parseTextJson<ComponentReadout>(result)

    expect(props.props.map(prop => prop.name).sort()).toEqual(['ctaHref', 'ctaLabel'])
  })

  it('returns non-style primitive props when StyleProps are excluded', async () => {
    const result = await running!.client.callTool({
      name: 'get_component_props',
      arguments: { name: 'Div', includeStyleProps: false },
    })
    saveResponse('get_component_props', 'Div-no-style-props', result)
    const props = parseTextJson<ComponentReadout>(result)

    expect(props.kind).toBe('primitive')
    expect(props.count).toBeGreaterThan(0)
    expect(props.usageSemantics.count).toContain('JSX opening-element occurrences')
    expect(props.styleProps.supported).toBe(true)
    expect(props.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'children', styleProp: false }),
        expect.objectContaining({ name: 'className', styleProp: false }),
      ]),
    )
    expect(props.props.every(prop => prop.styleProp !== true)).toBe(true)
  })
})
