import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  MATRIX_MCP_TIMEOUT_MS,
  parseTextJson,
  startMatrixMcp,
  stopMcpClient,
  type RunningMcpClient,
} from './helpers'

let running: RunningMcpClient | null = null

describe('get_component_examples', { timeout: MATRIX_MCP_TIMEOUT_MS }, () => {
  beforeAll(async () => {
    running = await startMatrixMcp()
  }, MATRIX_MCP_TIMEOUT_MS)

  afterAll(async () => {
    await stopMcpClient(running)
    running = null
  }, 10_000)

  it('returns captured usage examples for one component', async () => {
    const result = await running!.client.callTool({
      name: 'get_component_examples',
      arguments: { name: 'HeroBanner' },
    })
    const payload = parseTextJson<{ examples: string[]; name: string; source: string }>(result)

    expect(payload.name).toBe('HeroBanner')
    expect(payload.examples).toEqual(
      expect.arrayContaining([
        expect.stringContaining('<HeroBanner'),
      ]),
    )
  })
})
