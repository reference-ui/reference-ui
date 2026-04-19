import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_OUT_DIR, SYNC_OUTPUT_DIR_GLOB } from '../constants'

const FIXTURE_APP = '/workspace/app'
const FIXTURE_VIRTUAL = `${FIXTURE_APP}/${DEFAULT_OUT_DIR}/virtual`

async function importCopyAllModule() {
  vi.resetModules()

  const virtualDir = FIXTURE_VIRTUAL

  const emit = vi.fn()
  const debug = vi.fn()
  const resetDir = vi.fn(async () => {})
  const fg = vi.fn()
  const copyToVirtual = vi.fn(async (file: string, _root: string, vdir: string) => {
    return `${vdir}/${file.replace('/workspace/app/', '')}`
  })

  vi.doMock('fast-glob', () => ({
    default: fg,
  }))
  vi.doMock('../lib/event-bus', () => ({
    emit,
  }))
  vi.doMock('../lib/fs/reset-dir', () => ({
    resetDir,
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
  return { ...mod, emit, debug, resetDir, fg, copyToVirtual }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('fast-glob')
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('../lib/fs/reset-dir')
  vi.doUnmock('../lib/log')
  vi.doUnmock('../lib/paths')
  vi.doUnmock('./copy')
  vi.restoreAllMocks()
})

describe('virtual/copy-all', () => {
  it('resets the virtual directory before repopulating it', async () => {
    const { copyAll, resetDir, fg } = await importCopyAllModule()
    fg.mockResolvedValue([])

    await copyAll({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    })

    expect(resetDir).toHaveBeenCalledTimes(1)
    expect(resetDir).toHaveBeenCalledWith(FIXTURE_VIRTUAL)
  })

  it('emits virtual:copy:complete and skips globbing when include is empty', async () => {
    const { copyAll, emit, fg, copyToVirtual } = await importCopyAllModule()

    await copyAll({
      sourceDir: '/workspace/app',
      config: { include: [], debug: false } as never,
    })

    expect(fg).not.toHaveBeenCalled()
    expect(copyToVirtual).not.toHaveBeenCalled()
    expect(emit).toHaveBeenLastCalledWith('virtual:copy:complete', {
      virtualDir: FIXTURE_VIRTUAL,
    })
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
      ignore: ['**/node_modules/**', SYNC_OUTPUT_DIR_GLOB, '**/.git/**'],
    })
    expect(copyToVirtual).toHaveBeenCalledTimes(2)
    expect(emit).toHaveBeenNthCalledWith(1, 'virtual:fs:change', {
      event: 'add',
      path: `${FIXTURE_VIRTUAL}/src/alpha.ts`,
    })
    expect(emit).toHaveBeenNthCalledWith(2, 'virtual:fs:change', {
      event: 'add',
      path: `${FIXTURE_VIRTUAL}/src/beta.tsx`,
    })
    expect(emit).toHaveBeenLastCalledWith('virtual:copy:complete', {
      virtualDir: FIXTURE_VIRTUAL,
    })
  })
})
