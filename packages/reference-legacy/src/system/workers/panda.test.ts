import { afterEach, describe, expect, it, vi } from 'vitest'

const onHandlers = new Map<string, () => void>()

async function importWorkerModule() {
  vi.resetModules()
  onHandlers.clear()

  const emit = vi.fn()
  const onRunCodegen = vi.fn(async () => {})
  const onRunCss = vi.fn(async () => {})
  const startWorkerMemoryReporter = vi.fn()

  vi.doMock('../../lib/event-bus', () => ({
    emit,
    on: (event: string, handler: () => void) => {
      onHandlers.set(event, handler)
    },
  }))
  vi.doMock('../../lib/profiler', () => ({
    startWorkerMemoryReporter,
  }))
  vi.doMock('../../lib/thread-pool', () => ({
    KEEP_ALIVE: 'keep-alive',
  }))
  vi.doMock('../panda/gen', () => ({
    onRunCodegen,
    onRunCss,
  }))

  const mod = await import('./panda')
  return {
    ...mod,
    emit,
    onRunCodegen,
    onRunCss,
    startWorkerMemoryReporter,
  }
}

afterEach(() => {
  vi.resetModules()
  onHandlers.clear()
  vi.doUnmock('../../lib/event-bus')
  vi.doUnmock('../../lib/profiler')
  vi.doUnmock('../../lib/thread-pool')
  vi.doUnmock('../panda/gen')
  vi.restoreAllMocks()
})

describe('system/workers/panda', () => {
  it('registers Panda triggers and emits ready on startup', async () => {
    const { default: runPandaWorker, emit, startWorkerMemoryReporter } = await importWorkerModule()

    const result = await runPandaWorker()

    expect(result).toBe('keep-alive')
    expect(startWorkerMemoryReporter).toHaveBeenCalledWith('panda')
    expect(onHandlers.has('run:panda:codegen')).toBe(true)
    expect(onHandlers.has('run:panda:css')).toBe(true)
    expect(emit).toHaveBeenCalledWith('system:panda:ready')
  })
})