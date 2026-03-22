import { afterEach, describe, expect, it, vi } from 'vitest'

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
      virtualDir: '/workspace/app/.reference-ui/virtual',
    })

    expect(emit).toHaveBeenCalledWith('run:reference:component:copy', {
      virtualDir: '/workspace/app/.reference-ui/virtual',
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

  it('virtual:complete triggers config and reference work immediately when both workers are ready', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('system:config:ready')
    fireOn('reference:ready')
    emit.mockClear()
    fireOn('virtual:complete')

    expect(emit).toHaveBeenCalledWith('run:system:config', undefined)
    expect(emit).toHaveBeenCalledWith('run:reference:build', {})
  })

  it('buffers config and reference work until the workers become ready', async () => {
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
    expect(emit).toHaveBeenCalledWith('run:reference:build', {})
  })

  it('virtual fs changes trigger config and reference rebuilds after initial startup completes', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('virtual:complete')
    emit.mockClear()

    fireOn('virtual:fs:change', {
      event: 'change',
      path: '/workspace/app/.reference-ui/virtual/src/button.tsx',
    })

    expect(emit).toHaveBeenCalledWith('run:system:config', undefined)
    expect(emit).toHaveBeenCalledWith('run:reference:build', {})
  })

  it('waits for both panda codegen and reference output before bundling packages', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('packager:ready')
    emit.mockClear()
    fireOn('system:panda:codegen')

    expect(emit).not.toHaveBeenCalledWith('run:packager:bundle', undefined)
    fireOn('reference:complete', {
      source: 'virtual',
      manifestPath: '/tmp/types/manifest.js',
      outputDir: '/tmp/types',
    })

    expect(emit).toHaveBeenCalledWith('run:packager:bundle', undefined)
  })

  it('emits packager work when both inputs already finished before packager becomes ready', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    emit.mockClear()
    fireOn('system:panda:codegen')
    fireOn('reference:complete', {
      source: 'virtual',
      manifestPath: '/tmp/types/manifest.js',
      outputDir: '/tmp/types',
    })

    expect(emit).not.toHaveBeenCalledWith('run:packager:bundle')
    emit.mockClear()
    fireOn('packager:ready')

    expect(emit).toHaveBeenCalledWith('run:packager:bundle', undefined)
  })

  it('runs packager once per matched panda/reference completion pair', async () => {
    const { initEvents } = await loadEventsModule()
    initEvents()

    fireOn('packager:ready')
    emit.mockClear()

    fireOn('reference:complete', {
      source: 'virtual',
      manifestPath: '/tmp/types/manifest.js',
      outputDir: '/tmp/types',
    })
    expect(emit).not.toHaveBeenCalledWith('run:packager:bundle', undefined)

    fireOn('system:panda:codegen')
    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('run:packager:bundle', undefined)

    emit.mockClear()
    fireOn('system:panda:codegen')
    expect(emit).not.toHaveBeenCalledWith('run:packager:bundle', undefined)

    fireOn('reference:complete', {
      source: 'virtual',
      manifestPath: '/tmp/types/manifest.js',
      outputDir: '/tmp/types',
    })
    expect(emit).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenCalledWith('run:packager:bundle', undefined)
  })
})
