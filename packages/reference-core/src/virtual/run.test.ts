import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_OUT_DIR } from '../constants'

const FIXTURE_APP = '/workspace/app'
const FIXTURE_VIRTUAL = `${FIXTURE_APP}/${DEFAULT_OUT_DIR}/virtual`

async function importRunModule(options?: {
  isFragmentFile?: boolean
}) {
  vi.resetModules()

  const emit = vi.fn()
  const syncVirtualSnapshot = vi.fn(async () => {})
  const copyToVirtual = vi.fn(async () => `${FIXTURE_VIRTUAL}/src/button.tsx`)
  const removeFromVirtual = vi.fn(async () => {})
  const getVirtualPath = vi.fn(() => `${FIXTURE_VIRTUAL}/src/button.jsx`)
  const syncVirtualStyleCollection = vi.fn(async () => [])
  const isFragmentFile = vi.fn(async () => options?.isFragmentFile ?? false)
  const resolveBreakpointsForProject = vi.fn(async () => ({}))
  const invalidateBreakpointsCache = vi.fn()
  const debug = vi.fn()
  const error = vi.fn()

  vi.doMock('../lib/event-bus', () => ({
    emit,
  }))
  vi.doMock('./fs/copy', () => ({
    copyToVirtual,
    removeFromVirtual,
  }))
  vi.doMock('./fs/sync-snapshot', () => ({
    syncVirtualSnapshot,
  }))
  vi.doMock('./utils', () => ({
    getVirtualPath,
  }))
  vi.doMock('./style/collection', () => ({
    syncVirtualStyleCollection,
  }))
  vi.doMock('./fragments/detect', () => ({
    isFragmentFile,
  }))
  vi.doMock('./breakpoints/resolve', () => ({
    resolveBreakpointsForProject,
    invalidateBreakpointsCache,
  }))
  vi.doMock('../lib/log', () => ({
    log: { debug, error, info: vi.fn() },
  }))
  vi.doMock('../lib/paths', () => ({
    getVirtualDirPath: () => FIXTURE_VIRTUAL,
  }))

  const mod = await import('./run')
  return {
    ...mod,
    emit,
    syncVirtualSnapshot,
    copyToVirtual,
    removeFromVirtual,
    getVirtualPath,
    syncVirtualStyleCollection,
    isFragmentFile,
    resolveBreakpointsForProject,
    invalidateBreakpointsCache,
    debug,
    error,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('./fs/copy')
  vi.doUnmock('./fs/sync-snapshot')
  vi.doUnmock('./utils')
  vi.doUnmock('./style/collection')
  vi.doUnmock('./fragments/detect')
  vi.doUnmock('./breakpoints/resolve')
  vi.doUnmock('../lib/log')
  vi.doUnmock('../lib/paths')
  vi.restoreAllMocks()
})

describe('virtual/run', () => {
  it('runs the full snapshot sync for copy-all requests', async () => {
    const { runVirtualCopyAll, syncVirtualSnapshot } = await importRunModule()
    const payload = {
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    }

    await runVirtualCopyAll(payload)

    expect(syncVirtualSnapshot).toHaveBeenCalledWith(payload)
  })

  it('copies changed files and emits virtual:fs:change', async () => {
    const { runVirtualSyncFile, emit, copyToVirtual, syncVirtualStyleCollection, isFragmentFile } =
      await importRunModule()

    await runVirtualSyncFile(
      {
        sourceDir: '/workspace/app',
        config: { include: ['src/**/*'], debug: true } as never,
      },
      {
        event: 'change',
        path: '/workspace/app/src/button.tsx',
      },
    )

    expect(copyToVirtual).toHaveBeenCalledWith(
      '/workspace/app/src/button.tsx',
      '/workspace/app',
      FIXTURE_VIRTUAL,
      { debug: true, breakpoints: {} },
    )
    expect(syncVirtualStyleCollection).toHaveBeenCalledWith({
      root: '/workspace/app',
      virtualDir: FIXTURE_VIRTUAL,
      include: ['src/**/*'],
      breakpoints: {},
    })
    expect(isFragmentFile).toHaveBeenCalledWith('/workspace/app/src/button.tsx', 'change')
    expect(emit).toHaveBeenCalledWith('virtual:fs:change', {
      event: 'change',
      path: `${FIXTURE_VIRTUAL}/src/button.tsx`,
    })
  })

  it('emits virtual:fragment:change when the fragment detector matches', async () => {
    const { runVirtualSyncFile, emit } = await importRunModule({ isFragmentFile: true })

    await runVirtualSyncFile(
      {
        sourceDir: '/workspace/app',
        config: { include: ['src/**/*'], debug: false } as never,
      },
      {
        event: 'change',
        path: '/workspace/app/src/tokens.ts',
      },
    )

    expect(emit).toHaveBeenCalledWith('virtual:fragment:change', {
      event: 'change',
      path: `${FIXTURE_VIRTUAL}/src/button.tsx`,
    })
  })

  it('removes deleted files and emits the source-shaped virtual path', async () => {
    const {
      runVirtualSyncFile,
      emit,
      removeFromVirtual,
      getVirtualPath,
      syncVirtualStyleCollection,
    } = await importRunModule()

    await runVirtualSyncFile(
      {
        sourceDir: '/workspace/app',
        config: { include: ['src/**/*'], debug: false } as never,
      },
      {
        event: 'unlink',
        path: '/workspace/app/src/button.mdx',
      },
    )

    expect(getVirtualPath).toHaveBeenCalledWith(
      '/workspace/app/src/button.mdx',
      '/workspace/app',
      FIXTURE_VIRTUAL,
    )
    expect(removeFromVirtual).toHaveBeenCalledWith(
      '/workspace/app/src/button.mdx',
      '/workspace/app',
      FIXTURE_VIRTUAL,
    )
    expect(syncVirtualStyleCollection).toHaveBeenCalledWith({
      root: '/workspace/app',
      virtualDir: FIXTURE_VIRTUAL,
      include: ['src/**/*'],
      breakpoints: {},
    })
    expect(emit).toHaveBeenCalledWith('virtual:fs:change', {
      event: 'unlink',
      path: `${FIXTURE_VIRTUAL}/src/button.jsx`,
    })
  })

  it('emits virtual:failed when the copy-all handler fails', async () => {
    const { onRunVirtualCopyAll, emit, syncVirtualSnapshot, error } = await importRunModule()
    syncVirtualSnapshot.mockRejectedValue(new Error('copy exploded'))

    onRunVirtualCopyAll({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    })

    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith('[virtual] Copy failed:', expect.any(Error))
      expect(emit).toHaveBeenCalledWith('virtual:failed', {
        operation: 'copy:all',
        message: 'copy exploded',
      })
    })
  })

  it('emits virtual:failed when a watch sync fails', async () => {
    const { onRunVirtualSyncFile, emit, copyToVirtual, error } = await importRunModule()
    copyToVirtual.mockRejectedValue(new Error('rewrite exploded'))

    await onRunVirtualSyncFile(
      {
        sourceDir: '/workspace/app',
        config: { include: ['src/**/*'], debug: false } as never,
      },
      {
        event: 'add',
        path: '/workspace/app/src/button.tsx',
      },
    )

    expect(error).toHaveBeenCalledWith(
      '[virtual] Failed to process',
      'add',
      '/workspace/app/src/button.tsx',
      expect.any(Error),
    )
    expect(emit).toHaveBeenCalledWith('virtual:failed', {
      operation: 'sync:file',
      event: 'add',
      path: '/workspace/app/src/button.tsx',
      message: 'rewrite exploded',
    })
  })
})