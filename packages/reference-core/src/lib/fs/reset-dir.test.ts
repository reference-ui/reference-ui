import { afterEach, describe, expect, it, vi } from 'vitest'

async function importResetDirModule(options?: { dirExists?: boolean }) {
  vi.resetModules()

  const mkdir = vi.fn(async () => {})
  const rm = vi.fn(async () => {})

  vi.doMock('node:fs', () => ({
    existsSync: () => options?.dirExists ?? true,
  }))
  vi.doMock('node:fs/promises', () => ({
    mkdir,
    rm,
  }))

  const mod = await import('./reset-dir')
  return { ...mod, mkdir, rm }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('node:fs')
  vi.doUnmock('node:fs/promises')
  vi.restoreAllMocks()
})

describe('resetDir', () => {
  it('creates the directory when it does not exist', async () => {
    const { resetDir, mkdir, rm } = await importResetDirModule({ dirExists: false })

    await resetDir('/tmp/virtual')

    expect(rm).not.toHaveBeenCalled()
    expect(mkdir).toHaveBeenCalledTimes(1)
    expect(mkdir).toHaveBeenCalledWith('/tmp/virtual', { recursive: true })
  })

  it('recreates the directory after removing an existing tree', async () => {
    const { resetDir, mkdir, rm } = await importResetDirModule({ dirExists: true })

    await resetDir('/tmp/virtual')

    expect(rm).toHaveBeenCalledTimes(1)
    expect(rm).toHaveBeenCalledWith('/tmp/virtual', {
      recursive: true,
      force: true,
    })
    expect(mkdir).toHaveBeenCalledWith('/tmp/virtual', { recursive: true })
  })

  it('retries transient removal errors before succeeding', async () => {
    const { resetDir, mkdir, rm } = await importResetDirModule({ dirExists: true })
    rm
      .mockRejectedValueOnce(Object.assign(new Error('busy'), { code: 'ENOTEMPTY' }))
      .mockRejectedValueOnce(Object.assign(new Error('busy'), { code: 'EBUSY' }))
      .mockResolvedValue(undefined)

    await resetDir('/tmp/virtual', { retryDelaysMs: [0, 0, 0] })

    expect(rm).toHaveBeenCalledTimes(3)
    expect(mkdir).toHaveBeenCalledWith('/tmp/virtual', { recursive: true })
  })

  it('throws immediately for non-retryable removal errors', async () => {
    const { resetDir, mkdir, rm } = await importResetDirModule({ dirExists: true })
    rm.mockRejectedValueOnce(Object.assign(new Error('nope'), { code: 'EACCES' }))

    await expect(resetDir('/tmp/virtual', { retryDelaysMs: [0, 0, 0] })).rejects.toThrow(
      'nope',
    )

    expect(rm).toHaveBeenCalledTimes(1)
    expect(mkdir).not.toHaveBeenCalled()
  })
})