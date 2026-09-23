import { afterEach, describe, expect, it, vi } from 'vitest'

async function importWorkerModule() {
  vi.resetModules()

  const emit = vi.fn()
  const on = vi.fn()
  const onRunBundle = vi.fn()
  const onRunRuntimeBundle = vi.fn()

  vi.doMock('../lib/event-bus', () => ({
    emit,
    on,
  }))
  vi.doMock('./run', () => ({
    onRunBundle,
    onRunRuntimeBundle,
  }))

  const mod = await import('./worker')
  return { ...mod, emit, on, onRunBundle, onRunRuntimeBundle }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('./run')
  vi.restoreAllMocks()
})

describe('packager/worker', () => {
  it('subscribes to runtime and final bundle triggers', async () => {
    const { default: runPackager, on, onRunBundle, onRunRuntimeBundle } = await importWorkerModule()
    const payload = { cwd: '/workspace/app', skipTypescript: true }

    runPackager(payload)

    expect(on).toHaveBeenCalledWith('run:packager:runtime:bundle', expect.any(Function))
    expect(on).toHaveBeenCalledWith('run:packager:bundle', expect.any(Function))
    const handler = on.mock.calls[0][1]
    handler()
    expect(onRunRuntimeBundle).toHaveBeenCalledWith(payload)

    const finalHandler = on.mock.calls[1][1]
    finalHandler()
    expect(onRunBundle).toHaveBeenCalledWith(payload)
  })

  it('emits packager:ready on startup', async () => {
    const { default: runPackager, emit } = await importWorkerModule()

    runPackager({ cwd: '/workspace/app' })

    expect(emit).toHaveBeenCalledWith('packager:ready')
  })

  it('returns a promise that stays pending (KEEP_ALIVE)', async () => {
    const { default: runPackager } = await importWorkerModule()

    const resultPromise = runPackager({ cwd: '/workspace/app' })

    expect(resultPromise).toBeInstanceOf(Promise)
  })
})
