import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_OUT_DIR, SYNC_OUTPUT_DIR_GLOB } from '../constants'

const FIXTURE_APP = '/workspace/app'
const FIXTURE_VIRTUAL = `${FIXTURE_APP}/${DEFAULT_OUT_DIR}/virtual`
const FIXTURE_STAGING = `${FIXTURE_VIRTUAL}.next`

async function importCopyAllModule() {
  vi.resetModules()

  const virtualDir = FIXTURE_VIRTUAL

  const emit = vi.fn()
  const debug = vi.fn()
  const fg = vi.fn()
  const staging = {
    liveDir: virtualDir,
    stagingDir: FIXTURE_STAGING,
    reset: vi.fn(async () => {}),
    stageFile: vi.fn(async () => {}),
    publish: vi.fn(async () => {}),
  }
  const createVirtualStagingArea = vi.fn(() => staging)
  const writeReferenceUiVirtualArtifacts = vi.fn(async () => [])

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
    getVirtualDirPath: () => virtualDir,
  }))
  vi.doMock('./staging', () => ({
    createVirtualStagingArea,
  }))
  vi.doMock('./reference-ui-artifacts', () => ({
    writeReferenceUiVirtualArtifacts,
  }))

  const mod = await import('./copy-all')
  return {
    ...mod,
    emit,
    debug,
    fg,
    staging,
    createVirtualStagingArea,
    writeReferenceUiVirtualArtifacts,
  }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('fast-glob')
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('../lib/log')
  vi.doUnmock('../lib/paths')
  vi.doUnmock('./staging')
  vi.doUnmock('./reference-ui-artifacts')
  vi.restoreAllMocks()
})

describe('virtual/copy-all', () => {
  it('resets the staging directory before repopulating it', async () => {
    const { copyAll, fg, staging, writeReferenceUiVirtualArtifacts } = await importCopyAllModule()
    fg.mockResolvedValue([])

    await copyAll({
      sourceDir: '/workspace/app',
      config: { include: ['src/**/*'], debug: false } as never,
    })

    expect(staging.reset).toHaveBeenCalledTimes(1)
    expect(writeReferenceUiVirtualArtifacts).toHaveBeenCalledWith({
      root: '/workspace/app',
      virtualDir: FIXTURE_STAGING,
      include: ['src/**/*'],
    })
    expect(staging.publish).toHaveBeenCalledTimes(1)
  })

  it('emits virtual:copy:complete and skips globbing when include is empty', async () => {
    const { copyAll, emit, fg, staging, writeReferenceUiVirtualArtifacts } = await importCopyAllModule()

    await copyAll({
      sourceDir: '/workspace/app',
      config: { include: [], debug: false } as never,
    })

    expect(fg).not.toHaveBeenCalled()
    expect(staging.stageFile).not.toHaveBeenCalled()
    expect(writeReferenceUiVirtualArtifacts).not.toHaveBeenCalled()
    expect(staging.publish).toHaveBeenCalledTimes(1)
    expect(emit).toHaveBeenLastCalledWith('virtual:copy:complete', {
      virtualDir: FIXTURE_VIRTUAL,
    })
  })

  it('copies every matched file into staging and emits live virtual paths before completion', async () => {
    const {
      copyAll,
      emit,
      fg,
      staging,
      createVirtualStagingArea,
      writeReferenceUiVirtualArtifacts,
    } = await importCopyAllModule()
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
    expect(createVirtualStagingArea).toHaveBeenCalledWith(FIXTURE_VIRTUAL)
    expect(staging.stageFile).toHaveBeenCalledTimes(2)
    expect(staging.stageFile).toHaveBeenNthCalledWith(
      1,
      { file: '/workspace/app/src/alpha.ts', root: '/workspace/app', debug: true },
    )
    expect(staging.stageFile).toHaveBeenNthCalledWith(
      2,
      { file: '/workspace/app/src/beta.tsx', root: '/workspace/app', debug: true },
    )
    expect(writeReferenceUiVirtualArtifacts).toHaveBeenCalledWith({
      root: '/workspace/app',
      virtualDir: FIXTURE_STAGING,
      include: ['src/**/*.{ts,tsx}'],
    })
    expect(emit).toHaveBeenLastCalledWith('virtual:copy:complete', {
      virtualDir: FIXTURE_VIRTUAL,
    })
    expect(staging.publish).toHaveBeenCalledTimes(1)
  })
})
