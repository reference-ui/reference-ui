import { afterEach, describe, expect, it, vi } from 'vitest'

async function importStagingModule() {
  vi.resetModules()

  const emit = vi.fn()
  const resetDir = vi.fn(async () => {})
  const publishStagedDir = vi.fn(async () => {})
  const copyToVirtual = vi.fn(async (file: string, _root: string, stagingDir: string) => {
    return `${stagingDir}/${file.replace('/workspace/app/', '')}`
  })

  vi.doMock('../lib/event-bus', () => ({
    emit,
  }))
  vi.doMock('../lib/fs/reset-dir', () => ({
    resetDir,
  }))
  vi.doMock('../lib/fs/publish-staged-dir', () => ({
    publishStagedDir,
  }))
  vi.doMock('./copy', () => ({
    copyToVirtual,
  }))

  const mod = await import('./staging')
  return { ...mod, emit, resetDir, publishStagedDir, copyToVirtual }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('../lib/event-bus')
  vi.doUnmock('../lib/fs/reset-dir')
  vi.doUnmock('../lib/fs/publish-staged-dir')
  vi.doUnmock('./copy')
  vi.restoreAllMocks()
})

describe('virtual/staging', () => {
  it('builds the staging dir as a sibling of the live dir', async () => {
    const { getVirtualStagingDir, createVirtualStagingArea } = await importStagingModule()

    expect(getVirtualStagingDir('/workspace/app/.reference-ui/virtual')).toBe(
      '/workspace/app/.reference-ui/virtual.next'
    )
    expect(createVirtualStagingArea('/workspace/app/.reference-ui/virtual').stagingDir).toBe(
      '/workspace/app/.reference-ui/virtual.next'
    )
  })

  it('resets, stages, and publishes through the staging area API', async () => {
    const {
      createVirtualStagingArea,
      emit,
      resetDir,
      publishStagedDir,
      copyToVirtual,
    } = await importStagingModule()

    const staging = createVirtualStagingArea('/workspace/app/.reference-ui/virtual')

    await staging.reset()
    await staging.stageFile({
      file: '/workspace/app/src/demo.tsx',
      root: '/workspace/app',
      debug: true,
    })
    await staging.publish()

    expect(resetDir).toHaveBeenCalledWith('/workspace/app/.reference-ui/virtual.next')
    expect(copyToVirtual).toHaveBeenCalledWith(
      '/workspace/app/src/demo.tsx',
      '/workspace/app',
      '/workspace/app/.reference-ui/virtual.next',
      { debug: true },
    )
    expect(emit).toHaveBeenCalledWith('virtual:fs:change', {
      event: 'add',
      path: '/workspace/app/.reference-ui/virtual/src/demo.tsx',
    })
    expect(publishStagedDir).toHaveBeenCalledWith(
      '/workspace/app/.reference-ui/virtual.next',
      '/workspace/app/.reference-ui/virtual',
    )
  })
})