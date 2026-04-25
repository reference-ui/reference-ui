import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  connectSharedMatrixMcp,
  findTextContent,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  stopMcpClient,
  type ComponentReadout,
  type ComponentSummary,
  type RunningMcpClient,
} from './helpers'

let running: RunningMcpClient | null = null

describe('primitive observation', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await connectSharedMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('lists one canonical row for each observed primitive', async () => {
    const result = await running!.client.callTool({
      name: 'list_components',
      arguments: { source: '@reference-ui/react', limit: 100 },
    })
    const listed = parseTextJson<{ components: ComponentSummary[] }>(result)
    const names = listed.components.map(component => component.name)

    for (const name of ['Code', 'Div', 'H1', 'Main', 'P']) {
      expect(names.filter(candidate => candidate === name)).toHaveLength(1)
      expect(listed.components.find(component => component.name === name)?.count).toBeGreaterThan(0)
    }

    expect(names).not.toContain('Canvas')
  })

  it('makes Code discoverable by list query and direct lookup with matching usage', async () => {
    const listedResult = await running!.client.callTool({
      name: 'list_components',
      arguments: { query: 'Code' },
    })
    const listed = parseTextJson<{ components: ComponentSummary[] }>(listedResult)

    expect(listed.components).toHaveLength(1)
    expect(listed.components[0]).toEqual(
      expect.objectContaining({
        name: 'Code',
        count: 1,
        kind: 'primitive',
        source: '@reference-ui/react',
        usageSemantics: expect.objectContaining({
          count: expect.stringContaining('JSX opening-element occurrences'),
          usage: expect.stringContaining('usage thresholds'),
        }),
      }),
    )

    const detailResult = await running!.client.callTool({
      name: 'get_component',
      arguments: { name: 'Code' },
    })
    const detail = parseTextJson<ComponentReadout>(detailResult)

    expect(detail).toEqual(
      expect.objectContaining({
        name: 'Code',
        count: listed.components[0]?.count,
        usage: listed.components[0]?.usage,
        kind: 'primitive',
        source: '@reference-ui/react',
      }),
    )
  })

  it('reports Code props and examples from the observed JSX', async () => {
    const propsResult = await running!.client.callTool({
      name: 'get_component_props',
      arguments: { name: 'Code', includeStyleProps: false },
    })
    const props = parseTextJson<ComponentReadout>(propsResult)

    expect(props.count).toBe(1)
    expect(props.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          count: 1,
          name: 'children',
          origin: 'observed',
          styleProp: false,
        }),
      ]),
    )
    expect(props.props.every(prop => prop.styleProp !== true)).toBe(true)

    const examplesResult = await running!.client.callTool({
      name: 'get_component_examples',
      arguments: { name: 'Code' },
    })
    const examples = parseTextJson<{ examples: string[]; name: string; source: string }>(examplesResult)

    expect(examples).toEqual(
      expect.objectContaining({
        name: 'Code',
        source: '@reference-ui/react',
        examples: expect.arrayContaining([
          expect.stringContaining('<Code>'),
        ]),
      }),
    )
    expect(examples.examples.join('\n')).toContain('src/App.tsx')
  })

  it('does not expose unused primitives as components', async () => {
    const listedResult = await running!.client.callTool({
      name: 'list_components',
      arguments: { query: 'Canvas' },
    })
    const listed = parseTextJson<{ components: ComponentSummary[] }>(listedResult)

    expect(listed.components).toEqual([])

    const detailResult = await running!.client.callTool({
      name: 'get_component',
      arguments: { name: 'Canvas' },
    })

    expect((detailResult as { isError?: boolean }).isError).toBe(true)
    expect(findTextContent(detailResult)).toContain('Component not found: Canvas')
  })
})
