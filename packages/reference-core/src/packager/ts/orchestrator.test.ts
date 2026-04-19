import { afterEach, describe, expect, it, vi } from 'vitest'

const emit = vi.fn()
const runWorker = vi.fn()
const destroyDedicatedPool = vi.fn().mockResolvedValue(undefined)
const onHandlers = new Map<string, Array<(payload?: unknown) => void>>()

async function loadInitModule() {
  vi.resetModules()
  emit.mockClear()
  runWorker.mockClear()
  destroyDedicatedPool.mockClear()
  onHandlers.clear()

  vi.doMock('../../lib/event-bus', () => ({
    emit: (event: string, payload?: unknown) => emit(event, payload),
    on: (event: string, handler: (payload?: unknown) => void) => {
      const handlers = onHandlers.get(event) ?? []
      handlers.push(handler)
      onHandlers.set(event, handlers)
    },
  }))

  vi.doMock('../../lib/thread-pool', () => ({
    workers: {
      runWorker,
    },
    destroyDedicatedPool,
  }))

  vi.doMock('../packages', () => ({
    PACKAGES: [
      { name: '@reference-ui/react', entry: 'src/entry/react.ts', main: './react.mjs' },
      { name: '@reference-ui/system', entry: 'src/entry/system.ts', main: './system.mjs' },
      { name: '@reference-ui/types', entry: 'src/entry/types.ts', main: './types.mjs' },
    ],
  }))

  return import('./init')
}

function fireOn(event: string, payload?: unknown): void {
  for (const handler of onHandlers.get(event) ?? []) {
    handler(payload)
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../../lib/event-bus')
  vi.doUnmock('../../lib/thread-pool')
  vi.doUnmock('../packages')
  vi.restoreAllMocks()
})

describe('packager/ts/orchestrator', () => {
  it('buffers runtime DTS work until packager-ts becomes ready', async () => {
    const { initPackagerTsOrchestrator } = await loadInitModule()
    initPackagerTsOrchestrator()

    fireOn('packager-ts:runtime:requested')
    expect(emit).not.toHaveBeenCalledWith('run:packager-ts', expect.anything())

    emit.mockClear()
    fireOn('packager-ts:ready')
    expect(emit).toHaveBeenCalledWith('run:packager-ts', {
      completionEvent: 'packager-ts:runtime:complete',
    })
  })

  it('upgrades a pending runtime DTS rerun to a final DTS pass', async () => {
    const { initPackagerTsOrchestrator } = await loadInitModule()
    initPackagerTsOrchestrator()

    fireOn('packager-ts:ready')
    emit.mockClear()

    fireOn('packager-ts:runtime:requested')
    expect(emit).toHaveBeenCalledWith('run:packager-ts', {
      completionEvent: 'packager-ts:runtime:complete',
    })

    emit.mockClear()
    fireOn('packager-ts:final:requested')
    expect(emit).not.toHaveBeenCalled()

    fireOn('packager-ts:runtime:complete')
    expect(emit).toHaveBeenCalledWith('run:packager-ts', {
      completionEvent: 'packager-ts:complete',
    })
  })

  it('reruns runtime DTS when a fresh runtime request lands during an active runtime pass', async () => {
    const { initPackagerTsOrchestrator } = await loadInitModule()
    initPackagerTsOrchestrator()

    fireOn('packager-ts:ready')
    emit.mockClear()

    fireOn('packager-ts:runtime:requested')
    expect(emit).toHaveBeenCalledWith('run:packager-ts', {
      completionEvent: 'packager-ts:runtime:complete',
    })

    emit.mockClear()
    fireOn('packager-ts:runtime:requested')
    expect(emit).not.toHaveBeenCalled()

    fireOn('packager-ts:runtime:complete')
    expect(emit).toHaveBeenCalledWith('run:packager-ts', {
      completionEvent: 'packager-ts:runtime:complete',
    })
  })

  it('starts the packager-ts worker when typescript output is enabled', async () => {
    const { initTsPackager } = await loadInitModule()
    initTsPackager({
      cwd: '/workspace/app',
      config: {} as never,
      options: { watch: true },
    } as never)

    expect(runWorker).toHaveBeenCalledWith(
      'packager-ts',
      {
        cwd: '/workspace/app',
        config: {} as never,
        packages: [
          { name: '@reference-ui/react', sourceEntry: 'src/entry/react.ts', outFile: 'react.mjs' },
          { name: '@reference-ui/system', sourceEntry: 'src/entry/system.ts', outFile: 'system.mjs' },
          { name: '@reference-ui/types', sourceEntry: 'src/entry/types.ts', outFile: 'types.mjs' },
        ],
        watchMode: true,
      },
      { poolName: 'packager-ts' }
    )
  })

  it('recycles the packager-ts pool after final declarations in watch mode', async () => {
    const { initTsPackager } = await loadInitModule()
    initTsPackager({
      cwd: '/workspace/app',
      config: {} as never,
      options: { watch: true },
    } as never)

    expect(runWorker).toHaveBeenCalledTimes(1)

    fireOn('packager-ts:complete')

    await vi.waitFor(() => {
      expect(destroyDedicatedPool).toHaveBeenCalledWith('packager-ts')
    })
    expect(runWorker).toHaveBeenCalledTimes(2)
  })
})
