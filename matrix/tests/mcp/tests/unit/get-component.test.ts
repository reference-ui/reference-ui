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
    saveResponse('get_component', 'HeroBanner', result)
    const component = parseTextJson<ComponentReadout>(result)

    expect(component.name).toBe('HeroBanner')
    expect(component.kind).toBe('project')
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

  it('returns Reference UI primitive guides', async () => {
    const result = await running!.client.callTool({
      name: 'get_component',
      arguments: { name: 'Code' },
    })
    saveResponse('get_component', 'Code', result)
    const component = parseTextJson<ComponentReadout>(result)

    expect(component).toEqual(
      expect.objectContaining({
        name: 'Code',
        count: expect.any(Number),
        kind: 'primitive',
        source: '@reference-ui/react',
        interface: expect.objectContaining({ name: 'CodeProps' }),
        styleProps: expect.objectContaining({ supported: true }),
        usageSemantics: expect.objectContaining({
          count: expect.stringContaining('JSX opening-element occurrences'),
        }),
      }),
    )
    expect(component.count).toBeGreaterThan(0)
  })

  it('returns @reference-ui/lib component when queried in a standard project', async () => {
    const result = await running!.client.callTool({
      name: 'get_component',
      arguments: { name: 'Accordion' },
    })
    saveResponse('get_component', 'Accordion', result)
    const component = parseTextJson<ComponentReadout>(result)

    expect(component).toEqual(
      expect.objectContaining({
        name: 'Accordion',
        kind: 'component',
        source: '@reference-ui/lib',
        interface: expect.objectContaining({ name: 'AccordionProps', source: '@reference-ui/lib' }),
      })
    )
    expect(component.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'expansion' }),
        expect.objectContaining({ name: 'defaultValue' }),
      ])
    )
    expect(component.anatomy).toEqual(
      expect.objectContaining({
        pattern: 'compound',
        root: 'Accordion',
      })
    )
  })

  it('returns notice when requesting @reference-ui/lib component and use_reference_library is false', async () => {
    const rawTmpDir = join(tmpdir(), `ref-mcp-lib-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(rawTmpDir, { recursive: true })
    const tmpDir = realpathSync(rawTmpDir)

    try {
      writeMockProject(tmpDir, { useReferenceLibrary: false })
      const result = await running!.client.callTool({
        name: 'get_component',
        arguments: { name: 'Accordion', project: tmpDir },
      })
      saveResponse('get_component', 'disabled-lib', result)
      expect(result.isError).toBe(true)
      expect((result.content[0] as { text: string }).text).toContain("use_reference_library' is disabled in ui.config")
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})

