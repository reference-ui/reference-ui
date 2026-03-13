import { afterEach, describe, expect, it, vi } from 'vitest'

async function importCopyAllModule(options?: { virtualDirExists?: boolean }) {
  vi.resetModules()

  const emit = vi.fn()
  const debug = vi.fn()
  const mkdir = vi.fn(async () => {})
  const fg = vi.fn()
  const copyToVirtual = vi.fn(async (file: string, _root: string, virtualDir: string) => {
    return `${virtualDir}/${file.replace('/workspace/app/', '')}`
  })

  vi.doMock('node:fs', () => ({
    existsSync: () => options?.virtualDirExists ?? true,
  }))
  vi.doMock('node:fs/promises', () => ({
    mkdir,
  }))
  vi.doMock('fast-glob', () => ({
    default: fg,
  }))
  vi.doMock('../lib/event-bus', () => ({
    emit,
  }))
  vi.doMock('../lib/log', () => ({
    log: { debug, error: vi.fn(), info: vi.fn() },
  }))
  vi.doMock('../lib/paths', () => ({
    getVirtualDirPath: () => '/workspace/app/.reference-ui/virtual',
  }))
  vi.doMock('./copy', () => ({
    copyToVirtual,
  }))

  const mod = await import('./copy-all')
  return { ...mod, emit, debug, mkdir, fg, copyToVirtual }
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
    const { copyAll, mkdir, fg } = await importCopyAllModule({ virtualDirExists: false })
    fg.mockResolvedValue([])

    await copyAll({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    })

    expect(mkdir).toHaveBeenCalledWith('/workspace/app/.reference-ui/virtual', {
      recursive: true,
    })
  })

  it('emits virtual:complete and skips globbing when include is empty', async () => {
    const { copyAll, emit, fg, copyToVirtual } = await importCopyAllModule()

    await copyAll({
      sourceDir: '/workspace/app',
      config: { include: [], debug: false } as never,
    })

    expect(fg).not.toHaveBeenCalled()
    expect(copyToVirtual).not.toHaveBeenCalled()
    expect(emit).toHaveBeenCalledWith('virtual:complete', {})
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
    expect(emit).toHaveBeenNthCalledWith(1, 'virtual:fs:change', {
      event: 'add',
      path: '/workspace/app/.reference-ui/virtual/src/alpha.ts',
    })
    expect(emit).toHaveBeenNthCalledWith(2, 'virtual:fs:change', {
      event: 'add',
      path: '/workspace/app/.reference-ui/virtual/src/beta.tsx',
    })
    expect(emit).toHaveBeenLastCalledWith('virtual:complete', {})
  })
})
