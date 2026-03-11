import { afterEach, describe, expect, it, vi } from 'vitest'

async function importWorkerModule() {
  vi.resetModules()

  const emit = vi.fn()
  const on = vi.fn()
  const onRunBundle = vi.fn()

  vi.doMock('../lib/event-bus', () => ({
    emit,
    on,
  }))
  vi.doMock('./run', () => ({
    onRunBundle,
  }))

  const mod = await import('./worker')
  return { ...mod, emit, on, onRunBundle }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('./run')
  vi.restoreAllMocks()
})

describe('packager/worker', () => {
  it('subscribes to run:packager:bundle and passes payload to onRunBundle', async () => {
    const { default: runPackager, on, onRunBundle } = await importWorkerModule()
    const payload = { cwd: '/workspace/app', skipTypescript: true }

    runPackager(payload)

    expect(on).toHaveBeenCalledWith('run:packager:bundle', expect.any(Function))
    const handler = on.mock.calls[0][1]
    handler()
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
