import { describe, expect, it, vi, beforeEach } from 'vitest'

import { DEFAULT_OUT_DIR } from '../../constants'

const FIXTURE_MODEL = `/workspace/app/${DEFAULT_OUT_DIR}/mcp/model.json`

const emit = vi.fn()
const spawnMcpBuildChild = vi.fn()
const spawnMcpPrefetchAtlasChild = vi.fn()
const logDebug = vi.fn()
const logError = vi.fn()

vi.mock('../../lib/event-bus', () => ({
  emit,
}))

vi.mock('./child-process/process', () => ({
  spawnMcpBuildChild,
  spawnMcpPrefetchAtlasChild,
}))

vi.mock('../../lib/log', () => ({
  log: {
    debug: logDebug,
    error: logError,
  },
}))

describe('mcp/worker/run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('emits completion and logs timing when MCP build succeeds', async () => {
    spawnMcpBuildChild.mockResolvedValue({
      modelPath: FIXTURE_MODEL,
      componentCount: 1,
    })
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(1027)

    const { runMcpBuild } = await import('./run')

    await runMcpBuild({ cwd: '/workspace/app' })

    expect(spawnMcpBuildChild).toHaveBeenCalledWith('/workspace/app')
    expect(logDebug).toHaveBeenCalledWith('mcp', 'MCP build completed', {
      cwd: '/workspace/app',
      componentCount: 1,
      modelPath: FIXTURE_MODEL,
      durationMs: 27,
    })
    expect(emit).toHaveBeenCalledWith('mcp:complete', {
      modelPath: FIXTURE_MODEL,
      componentCount: 1,
    })
  })

  it('emits mcp:failed when MCP build throws', async () => {
    spawnMcpBuildChild.mockRejectedValue(new Error('boom'))
    const { onRunMcpBuild } = await import('./run')

    onRunMcpBuild({ cwd: '/workspace/app' })
    await Promise.resolve()
    await Promise.resolve()

    expect(logError).toHaveBeenCalled()
    expect(emit).toHaveBeenCalledWith('mcp:failed', { message: 'boom' })
  })

  it('emits prefetch complete after Atlas prefetch finishes', async () => {
    spawnMcpPrefetchAtlasChild.mockResolvedValue(undefined)
    const { runMcpAtlasPrefetch } = await import('./run')

    await runMcpAtlasPrefetch({ cwd: '/workspace/app' })

    expect(spawnMcpPrefetchAtlasChild).toHaveBeenCalledWith('/workspace/app')
    expect(emit).toHaveBeenCalledWith('mcp:prefetch:atlas:complete', {})
  })

  it('emits prefetch complete when Atlas prefetch fails', async () => {
    spawnMcpPrefetchAtlasChild.mockRejectedValue(new Error('atlas'))
    const { runMcpAtlasPrefetch } = await import('./run')

    await expect(runMcpAtlasPrefetch({ cwd: '/workspace/app' })).rejects.toThrow('atlas')
    expect(emit).toHaveBeenCalledWith('mcp:prefetch:atlas:complete', {})
  })
})
