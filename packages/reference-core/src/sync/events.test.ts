import { afterEach, describe, expect, it, vi } from 'vitest'

const emit = vi.fn()
const onHandlers = new Map<string, (payload?: unknown) => void>()
const onceAllHandlers = new Map<string, { events: string[]; handler: () => void }>()
let onceAllCallCount = 0

async function loadEventsModule() {
  vi.resetModules()
  onHandlers.clear()
  onceAllHandlers.clear()
  onceAllCallCount = 0
  emit.mockClear()

  vi.doMock('../lib/event-bus', () => ({
    emit: (event: string, payload?: unknown) => emit(event, payload),
    on: (event: string, handler: (payload?: unknown) => void) => {
      onHandlers.set(event, handler)
    },
    onceAll: (events: string[], handler: () => void) => {
      onceAllHandlers.set(`onceAll:${onceAllCallCount++}`, { events, handler })
    },
  }))

  const mod = await import('./events')
  return mod
}

function fireOn(event: string, payload?: unknown): void {
  onHandlers.get(event)?.(payload)
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/event-bus')
  vi.restoreAllMocks()
})

describe('sync/events', () => {
  it('initEvents registers handlers and config failed emits sync:failed', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    expect(onHandlers.has('system:config:failed')).toBe(true)
    fireOn('system:config:failed')

    expect(emit).toHaveBeenCalledWith('sync:failed', undefined)
  })

  it('panda codegen failed emits sync:failed', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    expect(onHandlers.has('system:panda:codegen:failed')).toBe(true)
    fireOn('system:panda:codegen:failed')

    expect(emit).toHaveBeenCalledWith('sync:failed', undefined)
  })

  it('run:panda:codegen emitted only when system:config:complete and system:panda:ready both fired', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    const pair = [...onceAllHandlers.entries()].find(
      ([, v]) =>
        v.events.length === 2 &&
        v.events.includes('system:config:complete') &&
        v.events.includes('system:panda:ready')
    )
    expect(pair).toBeDefined()
    const [, { handler }] = pair!

    emit.mockClear()
    handler()

    expect(emit).toHaveBeenCalledWith('run:panda:codegen', undefined)
  })

  it('system:panda:codegen triggers run:packager:bundle when packager already ready', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('packager:ready')
    emit.mockClear()
    fireOn('system:panda:codegen')

    expect(emit).toHaveBeenCalledWith('run:packager:bundle', undefined)
  })

  it('system:panda:codegen before packager:ready sets pendingPackagerBundle', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    emit.mockClear()
    fireOn('system:panda:codegen')

    expect(emit).not.toHaveBeenCalledWith('run:packager:bundle')
    emit.mockClear()
    fireOn('packager:ready')

    expect(emit).toHaveBeenCalledWith('run:packager:bundle', undefined)
  })
})
