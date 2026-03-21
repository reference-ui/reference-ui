import { afterEach, describe, expect, it, vi } from 'vitest'

async function importCopyAllModule(options?: { virtualDirExists?: boolean }) {
  vi.resetModules()

  const virtualDir = '/workspace/app/.reference-ui/virtual'
  const referenceBrowserPaths = [
    `${virtualDir}/_reference-component/component.tsx`,
    `${virtualDir}/_reference-component/primitives.ts`,
  ]
  const onceHandlers = new Map<string, (payload?: unknown) => void>()

  const emit = vi.fn((event: string) => {
    if (event === 'run:reference:copy-browser') {
      for (const path of referenceBrowserPaths) {
        emit('virtual:fs:change', { event: 'add', path })
      }
      onceHandlers.get('reference:browser:virtual-ready')?.()
    }
  })
  const once = vi.fn((event: string, handler: (payload?: unknown) => void) => {
    onceHandlers.set(event, handler)
  })
  const debug = vi.fn()
  const mkdir = vi.fn(async () => {})
  const rm = vi.fn(async () => {})
  const fg = vi.fn()
  const copyToVirtual = vi.fn(async (file: string, _root: string, vdir: string) => {
    return `${vdir}/${file.replace('/workspace/app/', '')}`
  })

  vi.doMock('node:fs', () => ({
    existsSync: () => options?.virtualDirExists ?? true,
  }))
  vi.doMock('node:fs/promises', () => ({
    mkdir,
    rm,
  }))
  vi.doMock('fast-glob', () => ({
    default: fg,
  }))
  vi.doMock('../lib/event-bus', () => ({
    emit,
    once,
  }))
  vi.doMock('../lib/log', () => ({
    log: { debug, error: vi.fn(), info: vi.fn() },
  }))
  vi.doMock('../lib/paths', () => ({
    getVirtualDirPath: () => virtualDir,
  }))
  vi.doMock('./copy', () => ({
    copyToVirtual,
  }))

  const mod = await import('./copy-all')
  return { ...mod, emit, once, debug, mkdir, rm, fg, copyToVirtual }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('node:fs')
  vi.doUnmock('node:fs/promises')
  vi.doUnmock('fast-glob')
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('../lib/log')
  vi.doUnmock('../lib/paths')
  vi.doUnmock('./copy')
  vi.restoreAllMocks()
})

describe('virtual/copy-all', () => {
  it('creates the virtual directory when it is missing', async () => {
    const { copyAll, mkdir, rm, fg } = await importCopyAllModule({ virtualDirExists: false })
    fg.mockResolvedValue([])

    await copyAll({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    })

    expect(mkdir).toHaveBeenCalledWith('/workspace/app/.reference-ui/virtual', {
      recursive: true,
    })
    expect(rm).not.toHaveBeenCalled()
  })

  it('clears the virtual directory before repopulating it', async () => {
    const { copyAll, mkdir, rm, fg } = await importCopyAllModule({ virtualDirExists: true })
    fg.mockResolvedValue([])

    await copyAll({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    })

    expect(rm).toHaveBeenCalledWith('/workspace/app/.reference-ui/virtual', {
      recursive: true,
      force: true,
    })
    expect(mkdir).toHaveBeenCalledWith('/workspace/app/.reference-ui/virtual', {
      recursive: true,
    })
  })

  it('emits virtual:complete and skips globbing when include is empty', async () => {
    const { copyAll, emit, fg, copyToVirtual, once } = await importCopyAllModule()

    await copyAll({
      sourceDir: '/workspace/app',
      config: { include: [], debug: false } as never,
    })

    expect(fg).not.toHaveBeenCalled()
    expect(copyToVirtual).not.toHaveBeenCalled()
    expect(once).toHaveBeenCalled()
    expect(emit).toHaveBeenNthCalledWith(1, 'run:reference:copy-browser', {
      virtualDir: '/workspace/app/.reference-ui/virtual',
    })
    expect(emit).toHaveBeenNthCalledWith(2, 'virtual:fs:change', {
      event: 'add',
      path: '/workspace/app/.reference-ui/virtual/_reference-component/component.tsx',
    })
    expect(emit).toHaveBeenNthCalledWith(3, 'virtual:fs:change', {
      event: 'add',
      path: '/workspace/app/.reference-ui/virtual/_reference-component/primitives.ts',
    })
    expect(emit).toHaveBeenLastCalledWith('virtual:complete', {})
  })

  it('copies every matched file and emits virtual fs changes before completion', async () => {
    const { copyAll, emit, fg, copyToVirtual } = await importCopyAllModule()
    fg.mockResolvedValue([
      '/workspace/app/src/alpha.ts',
      '/workspace/app/src/beta.tsx',
    ])

    await copyAll({
      sourceDir: '/workspace/app',
      config: {
        include: ['src/**/*.{ts,tsx}'],
        debug: true,
      } as never,
    })

    expect(fg).toHaveBeenCalledWith(['src/**/*.{ts,tsx}'], {
      cwd: '/workspace/app',
      onlyFiles: true,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.reference-ui/**', '**/.git/**'],
    })
    expect(copyToVirtual).toHaveBeenCalledTimes(2)
    expect(emit).toHaveBeenNthCalledWith(1, 'run:reference:copy-browser', {
      virtualDir: '/workspace/app/.reference-ui/virtual',
    })
    expect(emit).toHaveBeenNthCalledWith(2, 'virtual:fs:change', {
      event: 'add',
      path: '/workspace/app/.reference-ui/virtual/_reference-component/component.tsx',
    })
    expect(emit).toHaveBeenNthCalledWith(3, 'virtual:fs:change', {
      event: 'add',
      path: '/workspace/app/.reference-ui/virtual/_reference-component/primitives.ts',
    })
    expect(emit).toHaveBeenNthCalledWith(4, 'virtual:fs:change', {
      event: 'add',
      path: '/workspace/app/.reference-ui/virtual/src/alpha.ts',
    })
    expect(emit).toHaveBeenNthCalledWith(5, 'virtual:fs:change', {
      event: 'add',
      path: '/workspace/app/.reference-ui/virtual/src/beta.tsx',
    })
    expect(emit).toHaveBeenLastCalledWith('virtual:complete', {})
  })
})
