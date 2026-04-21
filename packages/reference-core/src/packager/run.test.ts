import { afterEach, describe, expect, it, vi } from 'vitest'

async function importRunModule(options?: {
  cliDir?: string
  installImpl?: () => Promise<void> | void
  packages?: unknown[]
}) {
  vi.resetModules()

  const debug = vi.fn()
  const error = vi.fn()
  const emit = vi.fn()
  const installPackages = vi.fn(async () => {
    await options?.installImpl?.()
  })
  const resolveCorePackageDir = vi.fn(() => options?.cliDir ?? '/core')

  vi.doMock('../lib/log', () => ({
    log: { debug, error },
  }))
  vi.doMock('../lib/event-bus', () => ({
    emit,
  }))
  vi.doMock('../lib/paths', () => ({
    resolveCorePackageDir,
  }))
  vi.doMock('./install', () => ({
    installPackages,
  }))
  vi.doMock('./packages', () => ({
    RUNTIME_PACKAGES: options?.packages ?? [{ name: 'react' }, { name: 'system' }, { name: 'styled' }],
    FINAL_PACKAGES: [{ name: 'types' }],
  }))

  const mod = await import('./run')
  return { ...mod, debug, error, emit, installPackages, resolveCorePackageDir }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/log')
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('../lib/paths')
  vi.doUnmock('./install')
  vi.doUnmock('./packages')
  vi.restoreAllMocks()
})

describe('packager/run', () => {
  it('installs runtime packages and emits runtime completion', async () => {
    const { runRuntimeBundle, emit, installPackages, resolveCorePackageDir } = await importRunModule({
      cliDir: '/workspace/core',
    })

    await runRuntimeBundle({ cwd: '/workspace/app', skipTypescript: true })

    expect(resolveCorePackageDir).toHaveBeenCalledWith('/workspace/app')
    expect(installPackages).toHaveBeenCalledWith(
      '/workspace/core',
      '/workspace/app',
      expect.arrayContaining([
        expect.objectContaining({ name: 'react' }),
        expect.objectContaining({ name: 'system' }),
      ])
    )
    expect(emit).toHaveBeenNthCalledWith(1, 'packager:runtime:complete', {
      packageCount: 3,
      durationMs: expect.any(Number),
    })
    expect(emit).toHaveBeenNthCalledWith(2, 'packager-ts:runtime:complete', {})
  })

  it('installs packages and emits both completion events when skipTypescript is enabled', async () => {
    const { runBundle, emit, installPackages, resolveCorePackageDir } = await importRunModule({
      cliDir: '/workspace/core',
    })

    await runBundle({ cwd: '/workspace/app', skipTypescript: true })

    expect(resolveCorePackageDir).toHaveBeenCalledWith('/workspace/app')
    expect(installPackages).toHaveBeenCalledWith(
      '/workspace/core',
      '/workspace/app',
      expect.arrayContaining([
        expect.objectContaining({ name: 'types' }),
      ])
    )
    expect(emit).toHaveBeenNthCalledWith(1, 'packager:complete', {
      packageCount: 1,
      durationMs: expect.any(Number),
    })
    expect(emit).toHaveBeenNthCalledWith(2, 'packager-ts:complete', {})
  })

  it('does not emit packager-ts:complete when skipTypescript is disabled', async () => {
    const { runBundle, emit } = await importRunModule()

    await runBundle({ cwd: '/workspace/app' })

    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('packager:complete', {
      packageCount: 1,
      durationMs: expect.any(Number),
    })
  })

  it('passes explicit build install options when requested', async () => {
    const { runRuntimeBundle, installPackages } = await importRunModule({
      cliDir: '/workspace/core',
    })

    await runRuntimeBundle({ cwd: '/workspace/app', installMode: 'build' })

    expect(installPackages).toHaveBeenCalledWith(
      '/workspace/core',
      '/workspace/app',
      expect.arrayContaining([
        expect.objectContaining({ name: 'react' }),
        expect.objectContaining({ name: 'system' }),
      ]),
      { mode: 'build' }
    )
  })

  it('passes explicit dev install options when requested', async () => {
    const { runRuntimeBundle, installPackages } = await importRunModule({
      cliDir: '/workspace/core',
    })

    await runRuntimeBundle({ cwd: '/workspace/app', installMode: 'dev' })

    expect(installPackages).toHaveBeenCalledWith(
      '/workspace/core',
      '/workspace/app',
      expect.arrayContaining([
        expect.objectContaining({ name: 'react' }),
        expect.objectContaining({ name: 'system' }),
      ]),
      { mode: 'dev' }
    )
  })

  it('propagates install failures without emitting completion', async () => {
    const { runBundle, emit } = await importRunModule({
      installImpl: async () => {
        throw new Error('bundle exploded')
      },
    })

    await expect(runBundle({ cwd: '/workspace/app' })).rejects.toThrow('bundle exploded')
    expect(emit).not.toHaveBeenCalled()
  })

  it('logs an error when onRunBundle is triggered without cwd', async () => {
    const { onRunBundle, error } = await importRunModule()

    onRunBundle({ cwd: '' })

    expect(error).toHaveBeenCalledWith('[packager] run:packager:bundle: payload.cwd is undefined')
  })

  it('logs async bundle failures in onRunBundle', async () => {
    const { onRunBundle, error } = await importRunModule({
      installImpl: async () => {
        throw new Error('bundle exploded')
      },
    })

    onRunBundle({ cwd: '/workspace/app' })

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith('[packager] Bundle failed:', expect.any(Error))
    })
  })

  it('logs an error when onRunRuntimeBundle is triggered without cwd', async () => {
    const { onRunRuntimeBundle, error } = await importRunModule()

    onRunRuntimeBundle({ cwd: '' })

    expect(error).toHaveBeenCalledWith('[packager] run:packager:runtime:bundle: payload.cwd is undefined')
  })
})
