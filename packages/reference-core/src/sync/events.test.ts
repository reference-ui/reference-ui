import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_OUT_DIR } from '../constants'

const FIXTURE_VIRTUAL = `/workspace/app/${DEFAULT_OUT_DIR}/virtual`

const emit = vi.fn()
const onHandlers = new Map<string, Array<(payload?: unknown) => void>>()

async function loadEventsModule() {
  vi.resetModules()
  onHandlers.clear()
  emit.mockClear()

  vi.doMock('../lib/event-bus', () => ({
    emit: (event: string, payload?: unknown) => emit(event, payload),
    on: (event: string, handler: (payload?: unknown) => void) => {
      const handlers = onHandlers.get(event) ?? []
      handlers.push(handler)
      onHandlers.set(event, handlers)
    },
    onceAll: () => {},
  }))

  const mod = await import('./events')
  return mod
}

function fireOn(event: string, payload?: unknown): void {
  for (const handler of onHandlers.get(event) ?? []) {
    handler(payload)
  }
}

afterEach(() => {
  vi.useRealTimers()
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

  it('virtual failure emits sync:failed', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    expect(onHandlers.has('virtual:failed')).toBe(true)
    fireOn('virtual:failed', {
      operation: 'copy:all',
      message: 'native binary missing',
    })

    expect(emit).toHaveBeenCalledWith('sync:failed', undefined)
  })

  it('reference component copy failure emits sync:failed', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    expect(onHandlers.has('reference:component:copy-failed')).toBe(true)
    fireOn('reference:component:copy-failed', {
      message: 'copy exploded',
    })

    expect(emit).toHaveBeenCalledWith('sync:failed', undefined)
  })

  it('packager-ts failure emits sync:failed', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    expect(onHandlers.has('packager-ts:failed')).toBe(true)
    fireOn('packager-ts:failed')

    expect(emit).toHaveBeenCalledWith('sync:failed', undefined)
  })

  it('run:panda:codegen emitted only when system:config:complete and system:panda:ready both fired', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('system:config:complete')
    expect(emit).not.toHaveBeenCalledWith('run:panda:codegen', undefined)

    emit.mockClear()
    fireOn('system:panda:ready')
    expect(emit).toHaveBeenCalledWith('run:panda:codegen', undefined)
  })

  it('virtual:copy:complete triggers reference component copy', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    emit.mockClear()
    fireOn('virtual:copy:complete', {
      virtualDir: FIXTURE_VIRTUAL,
    })

    expect(emit).toHaveBeenCalledWith('run:reference:component:copy', {
      virtualDir: FIXTURE_VIRTUAL,
    })
  })

  it('reference component copy completion promotes the full virtual pipeline to complete', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    emit.mockClear()
    fireOn('reference:component:copied')

    expect(emit).toHaveBeenCalledWith('virtual:complete', {})
  })

  it('reruns panda codegen when config completes again after panda is ready', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('system:panda:ready')
    emit.mockClear()

    fireOn('system:config:complete')
    expect(emit).toHaveBeenCalledWith('run:panda:codegen', undefined)

    emit.mockClear()
    fireOn('system:config:complete')
    expect(emit).toHaveBeenCalledWith('run:panda:codegen', undefined)
  })

  it('virtual:complete triggers config work immediately but reference waits for runtime declarations', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('system:config:ready')
    fireOn('reference:ready')
    fireOn('packager:ready')
    emit.mockClear()
    fireOn('virtual:complete')

    expect(emit).toHaveBeenCalledWith('run:system:config', undefined)
    expect(emit).not.toHaveBeenCalledWith('run:reference:build', {})
  })

  it('buffers config work until ready and reference work until runtime declarations complete', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('virtual:complete')
    expect(emit).not.toHaveBeenCalledWith('run:system:config', undefined)
    expect(emit).not.toHaveBeenCalledWith('run:reference:build', {})

    emit.mockClear()
    fireOn('system:config:ready')
    expect(emit).toHaveBeenCalledWith('run:system:config', undefined)
    expect(emit).not.toHaveBeenCalledWith('run:reference:build', {})

    emit.mockClear()
    fireOn('reference:ready')
    expect(emit).not.toHaveBeenCalledWith('run:reference:build', {})

    emit.mockClear()
    fireOn('packager:ready')
    fireOn('packager-ts:runtime:complete')
    expect(emit).toHaveBeenCalledWith('run:reference:build', {})
  })

  it('emits sync:complete when final TypeScript declarations finish', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    emit.mockClear()
    fireOn('packager-ts:complete')

    expect(emit).toHaveBeenCalledWith('sync:complete', undefined)
  })

  it('virtual fs changes trigger config and reference rebuilds after the watch burst settles', async () => {
    vi.useFakeTimers()

    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('virtual:complete')
    fireOn('packager-ts:complete')
    emit.mockClear()

    fireOn('virtual:fs:change', {
      event: 'change',
      path: `${FIXTURE_VIRTUAL}/src/button.tsx`,
    })

    expect(emit).not.toHaveBeenCalledWith('run:system:config', undefined)
    expect(emit).not.toHaveBeenCalledWith('run:reference:build', {})

    await vi.advanceTimersByTimeAsync(50)

    expect(emit).toHaveBeenCalledWith('run:system:config', undefined)
    expect(emit).toHaveBeenCalledWith('run:reference:build', {})
  })

  it('fragment-only changes trigger one coalesced config rebuild without reference work', async () => {
    vi.useFakeTimers()

    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('virtual:complete')
    emit.mockClear()

    fireOn('virtual:fragment:change', {
      event: 'change',
      path: `${FIXTURE_VIRTUAL}/src/theme/tokens.ts`,
    })
    fireOn('virtual:fragment:change', {
      event: 'change',
      path: `${FIXTURE_VIRTUAL}/src/theme/recipes.ts`,
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('run:system:config', undefined)
    expect(emit).not.toHaveBeenCalledWith('run:reference:build', {})
  })

  it('coalesces mixed virtual change bursts into one config rebuild and one reference rebuild', async () => {
    vi.useFakeTimers()

    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('virtual:complete')
    emit.mockClear()

    fireOn('virtual:fragment:change', {
      event: 'change',
      path: `${FIXTURE_VIRTUAL}/src/theme/tokens.ts`,
    })
    await vi.advanceTimersByTimeAsync(25)
    fireOn('virtual:fs:change', {
      event: 'unlink',
      path: `${FIXTURE_VIRTUAL}/src/components/Card.tsx`,
    })
    await vi.advanceTimersByTimeAsync(25)
    fireOn('virtual:fs:change', {
      event: 'add',
      path: `${FIXTURE_VIRTUAL}/src/components/LegacyCard.tsx`,
    })

    expect(emit).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(50)

    expect(emit).toHaveBeenCalledTimes(2)
    expect(emit).toHaveBeenCalledWith('run:system:config', undefined)
    expect(emit).toHaveBeenCalledWith('run:reference:build', {})
  })

  it('waits for panda codegen before bundling runtime packages', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('packager:ready')
    emit.mockClear()
    fireOn('system:panda:codegen')

    expect(emit).toHaveBeenCalledWith('run:packager:runtime:bundle', undefined)
  })

  it('emits runtime packager work when panda already finished before packager becomes ready', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    emit.mockClear()
    fireOn('system:panda:codegen')

    expect(emit).not.toHaveBeenCalledWith('run:packager:runtime:bundle')
    emit.mockClear()
    fireOn('packager:ready')

    expect(emit).toHaveBeenCalledWith('run:packager:runtime:bundle', undefined)
  })

  it('runs runtime packager once per fresh panda completion and final packager once per fresh reference completion', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('packager:ready')
    emit.mockClear()

    fireOn('system:panda:codegen')
    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('run:packager:runtime:bundle', undefined)

    emit.mockClear()
    fireOn('system:panda:codegen')
    expect(emit).toHaveBeenCalledWith('run:packager:runtime:bundle', undefined)

    emit.mockClear()
    fireOn('reference:complete', {
      source: 'virtual',
      manifestPath: '/tmp/types/manifest.js',
      outputDir: '/tmp/types',
    })
    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('run:packager:bundle', undefined)
  })

  it('emits final packager work when reference output already exists before packager becomes ready', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    emit.mockClear()
    fireOn('reference:complete', {
      source: 'virtual',
      manifestPath: '/tmp/types/manifest.js',
      outputDir: '/tmp/types',
    })
    expect(emit).not.toHaveBeenCalledWith('run:packager:bundle', undefined)

    emit.mockClear()
    fireOn('packager:ready')
    expect(emit).toHaveBeenCalledWith('run:packager:bundle', undefined)
  })
})
