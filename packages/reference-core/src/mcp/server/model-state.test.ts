import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  classifyProjectError,
  createMcpModelState,
  McpProjectModelState,
} from './model-state'
import { McpChildProcessError } from '../worker/child-process/process'
import type { McpBuildArtifact } from '../pipeline/types'

vi.mock('../../lib/log', () => ({
  log: {
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}))

vi.mock('../pipeline/artifact', () => ({
  readMcpArtifact: vi.fn(),
}))

vi.mock('../pipeline/paths', () => ({
  getMcpModelPath: vi.fn((cwd: string) => `${cwd}/.reference-ui/model.json`),
}))

vi.mock('../worker/child-process/process', () => ({
  McpChildProcessError: class extends Error {
    constructor(
      public readonly errorType: 'config_not_found' | 'config_invalid' | 'missing_artifacts' | 'build_failed',
      message: string
    ) {
      super(message)
    }
  },
  spawnMcpBuildChild: vi.fn(),
}))

import { existsSync } from 'node:fs'
import { readMcpArtifact } from '../pipeline/artifact'
import { spawnMcpBuildChild } from '../worker/child-process/process'

describe('classifyProjectError', () => {
  it('preserves McpChildProcessError code', () => {
    const err = new McpChildProcessError('config_not_found', 'No ui.config')
    const classified = classifyProjectError(err)
    expect(classified.code).toBe('config_not_found')
    expect(classified.message).toBe('No ui.config')
  })

  it('classifies manifest.js errors as missing_artifacts', () => {
    const classified = classifyProjectError(new Error('Cannot find manifest.js'))
    expect(classified.code).toBe('missing_artifacts')
  })

  it('classifies ref sync errors as missing_artifacts', () => {
    const classified = classifyProjectError(new Error('Please run ref sync'))
    expect(classified.code).toBe('missing_artifacts')
  })

  it('defaults to build_failed for unknown errors', () => {
    const classified = classifyProjectError(new Error('SyntaxError: unexpected token'))
    expect(classified.code).toBe('build_failed')
    expect(classified.message).toBe('SyntaxError: unexpected token')
  })
})

describe('McpProjectModelState', () => {
  const dummyArtifact: McpBuildArtifact = {
    schemaVersion: 1,
    generatedAt: '2026-01-01T00:00:00Z',
    workspaceRoot: '/test',
    manifestPath: '/test/manifest.js',
    diagnostics: [],
    components: [],
    tokens: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in idle status with no error', () => {
    const state = new McpProjectModelState({ cwd: '/test' })
    expect(state.status).toBe('idle')
    expect(state.error).toBeNull()
  })

  it('throws on load() when not ready', async () => {
    const state = new McpProjectModelState({ cwd: '/test' })
    await expect(state.load()).rejects.toThrow('Model is not ready')
  })

  it('loads cached artifact when cache exists', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(readMcpArtifact).mockResolvedValue(dummyArtifact)
    vi.mocked(spawnMcpBuildChild).mockResolvedValue(undefined as never)

    const state = createMcpModelState({ cwd: '/test' })
    await state.warmStart()

    expect(state.status).toBe('ready')
    expect(state.error).toBeNull()
    const loaded = await state.load()
    expect(loaded).toEqual(dummyArtifact)
  })

  it('spawns child build when no cache exists', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    vi.mocked(spawnMcpBuildChild).mockResolvedValue(undefined as never)
    vi.mocked(readMcpArtifact).mockResolvedValue(dummyArtifact)

    const state = new McpProjectModelState({ cwd: '/test' })
    const artifact = await state.waitForReady()

    expect(spawnMcpBuildChild).toHaveBeenCalledWith('/test')
    expect(artifact).toEqual(dummyArtifact)
    expect(state.status).toBe('ready')
  })

  it('handles child build error gracefully and records structured error', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    vi.mocked(spawnMcpBuildChild).mockRejectedValue(
      new McpChildProcessError('config_invalid', 'Syntax error in config')
    )

    const state = new McpProjectModelState({ cwd: '/test' })
    const result = await state.waitForReady()

    expect(result).toBeNull()
    expect(state.status).toBe('error')
    expect(state.error).toEqual({
      code: 'config_invalid',
      message: 'Syntax error in config',
    })
  })

  it('allows recovery and reload after an initial failure', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    vi.mocked(spawnMcpBuildChild).mockRejectedValueOnce(
      new Error('manifest.js missing')
    )

    const state = new McpProjectModelState({ cwd: '/test' })
    await state.warmStart()
    expect(state.status).toBe('error')
    expect(state.error?.code).toBe('missing_artifacts')

    // Now user fixes the problem (e.g. runs ref sync)
    vi.mocked(spawnMcpBuildChild).mockResolvedValueOnce(undefined as never)
    vi.mocked(readMcpArtifact).mockResolvedValueOnce(dummyArtifact)

    await state.reload()
    expect(state.status).toBe('ready')
    expect(state.error).toBeNull()
    expect(await state.load()).toEqual(dummyArtifact)
  })

  it('times out and returns null if ready promise does not settle within timeoutMs', async () => {
    vi.mocked(existsSync).mockReturnValue(false)
    // Never resolve child process
    vi.mocked(spawnMcpBuildChild).mockImplementation(() => new Promise(() => {}))

    const state = new McpProjectModelState({ cwd: '/test' })
    const result = await state.waitForReady(20)

    expect(result).toBeNull()
  })
})
