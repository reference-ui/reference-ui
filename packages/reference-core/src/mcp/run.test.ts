import { describe, expect, it, vi, beforeEach } from 'vitest'

const emit = vi.fn()
const buildMcpArtifact = vi.fn()
const logDebug = vi.fn()
const logError = vi.fn()

vi.mock('../lib/event-bus', () => ({
  emit,
}))

vi.mock('./build', () => ({
  buildMcpArtifact,
  prefetchMcpAtlas: vi.fn(),
}))

vi.mock('../lib/log', () => ({
  log: {
    debug: logDebug,
    error: logError,
  },
}))

describe('mcp/run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits completion and logs timing when MCP build succeeds', async () => {
    buildMcpArtifact.mockResolvedValue({ components: [{ name: 'Button' }] })
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(1027)

    const { runMcpBuild } = await import('./run')

    await runMcpBuild({ cwd: '/workspace/app' })

    expect(logDebug).toHaveBeenCalledWith('mcp', 'MCP build completed', {
      cwd: '/workspace/app',
      componentCount: 1,
      modelPath: '/workspace/app/.reference-ui/mcp/model.json',
      durationMs: 27,
    })
    expect(emit).toHaveBeenCalledWith('mcp:complete', {
      modelPath: '/workspace/app/.reference-ui/mcp/model.json',
      componentCount: 1,
    })
  })

  it('emits mcp:failed when MCP build throws', async () => {
    buildMcpArtifact.mockRejectedValue(new Error('boom'))
    const { onRunMcpBuild } = await import('./run')

    onRunMcpBuild({ cwd: '/workspace/app' })
    await Promise.resolve()
    await Promise.resolve()

    expect(logError).toHaveBeenCalled()
    expect(emit).toHaveBeenCalledWith('mcp:failed', { message: 'boom' })
  })
})
