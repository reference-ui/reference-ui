import { afterEach, describe, expect, it, vi } from 'vitest'

const onHandlers = new Map<string, (payload?: unknown) => unknown>()

async function importWorkerModule() {
  vi.resetModules()
  onHandlers.clear()

  const emit = vi.fn()
  const onRunVirtualCopyAll = vi.fn()
  const onRunVirtualSyncFile = vi.fn(async () => {})

  vi.doMock('../lib/event-bus', () => ({
    emit,
    on: (event: string, handler: (payload?: unknown) => unknown) => {
      onHandlers.set(event, handler)
    },
  }))
  vi.doMock('../lib/thread-pool', () => ({
    KEEP_ALIVE: 'keep-alive',
  }))
  vi.doMock('./run', () => ({
    onRunVirtualCopyAll,
    onRunVirtualSyncFile,
  }))

  const mod = await import('./worker')
  return {
    ...mod,
    emit,
    onRunVirtualCopyAll,
    onRunVirtualSyncFile,
  }
}

afterEach(() => {
  vi.resetModules()
  onHandlers.clear()
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('../lib/thread-pool')
  vi.doUnmock('./run')
  vi.restoreAllMocks()
})

describe('virtual/worker', () => {
  it('registers handlers and emits virtual:ready on startup', async () => {
    const { default: runVirtual, emit } = await importWorkerModule()

    const result = await runVirtual({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    })

    expect(result).toBe('keep-alive')
    expect(onHandlers.has('run:virtual:copy:all')).toBe(true)
    expect(onHandlers.has('run:virtual:sync:file')).toBe(true)
    expect(emit).toHaveBeenCalledWith('virtual:ready')
  })

  it('delegates copy-all events to virtual/run', async () => {
    const { default: runVirtual, onRunVirtualCopyAll } = await importWorkerModule()
    const payload = {
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: true } as never,
    }

    await runVirtual(payload)

    onHandlers.get('run:virtual:copy:all')?.()

    expect(onRunVirtualCopyAll).toHaveBeenCalledWith(payload)
  })

  it('delegates watch events to virtual/run', async () => {
    const { default: runVirtual, onRunVirtualSyncFile } = await importWorkerModule()
    const payload = {
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    }
    const event = {
      event: 'change',
      path: '/workspace/app/src/button.tsx',
    }

    await runVirtual(payload)

    await onHandlers.get('run:virtual:sync:file')?.(event)

    expect(onRunVirtualSyncFile).toHaveBeenCalledWith(payload, event)
  })
})
