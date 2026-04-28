import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  connectSharedMatrixMcp,
  findTextResource,
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  stopMcpClient,
  type ComponentModel,
  type RunningMcpClient,
} from './helpers'

let running: RunningMcpClient | null = null

describe('matrix MCP resources', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await connectSharedMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('serves a compact component model resource', async () => {
    const resource = await running!.client.readResource({
      uri: 'reference-ui://component-model',
    })
    const modelJson = findTextResource(resource)
    const model = modelJson ? (JSON.parse(modelJson.text) as ComponentModel) : null

    expect(modelJson).not.toBeNull()
    expect(modelJson?.mimeType).toBe('application/json')
    expect(model?.schemaVersion).toBe(1)
    expect(typeof model?.generatedAt).toBe('string')
    expect(model?.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'HeroBanner',
          interfaceName: 'HeroBannerProps',
          observedProps: expect.arrayContaining(['body', 'ctaHref', 'ctaLabel', 'heading']),
        }),
      ]),
    )
    expect(modelJson?.text).not.toContain('workspaceRoot')
    expect(modelJson?.text).not.toContain('manifestPath')
    expect(modelJson?.text).not.toContain('diagnostics')
    expect(modelJson?.text).not.toContain('"props"')
  })

  it('serves a getting-started resource for clients that do not surface instructions', async () => {
    const resource = await running!.client.readResource({
      uri: 'reference-ui://getting-started',
    })
    const gettingStarted = findTextResource(resource)

    expect(gettingStarted?.mimeType).toBe('text/markdown')
    expect(gettingStarted?.text).toContain('Reference UI Start Guide')
    expect(gettingStarted?.text).toContain('get_component_props')
  })

  it('serves the getting-started guide as a tool', async () => {
    const result = await running!.client.callTool({
      name: 'getting_started',
      arguments: {},
    })
    const payload = parseTextJson<{ guide: string }>(result)

    expect(payload.guide).toContain('Reference UI Start Guide')
    expect(payload.guide).toContain('@reference-ui/react')
  })
})
