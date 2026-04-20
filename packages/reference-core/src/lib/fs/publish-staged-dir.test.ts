import { afterEach, describe, expect, it, vi } from 'vitest'

async function importPublishStagedDirModule(options?: {
  existingDirs?: string[]
  renameErrorAtCall?: number
}) {
  vi.resetModules()

  const rename = vi.fn(async () => {})
  const rm = vi.fn(async () => {})
  let existing = new Set(options?.existingDirs ?? [])
  let renameCalls = 0

  rename.mockImplementation(async (from: string, to: string) => {
    renameCalls += 1
    if (options?.renameErrorAtCall === renameCalls) {
      throw new Error('rename failed')
    }
    existing.delete(from)
    existing.add(to)
  })

  rm.mockImplementation(async (dirPath: string) => {
    existing.delete(dirPath)
  })

  vi.doMock('node:fs', () => ({
    existsSync: (dirPath: string) => existing.has(dirPath),
  }))
  vi.doMock('node:fs/promises', () => ({
    rename,
    rm,
  }))

  const mod = await import('./publish-staged-dir')
  return { ...mod, rename, rm }
}

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('node:fs')
  vi.doUnmock('node:fs/promises')
  vi.restoreAllMocks()
})

describe('publishStagedDir', () => {
  it('publishes the staged tree directly when no live directory exists', async () => {
    const stagedDir = '/tmp/virtual.next'
    const liveDir = '/tmp/virtual'
    const { publishStagedDir, rename, rm } = await importPublishStagedDirModule({
      existingDirs: [stagedDir],
    })

    await publishStagedDir(stagedDir, liveDir)

    expect(rename).toHaveBeenCalledTimes(1)
    expect(rename).toHaveBeenCalledWith(stagedDir, liveDir)
    expect(rm).not.toHaveBeenCalled()
  })

  it('moves the live tree aside, publishes the staged tree, then removes the previous tree', async () => {
    const stagedDir = '/tmp/virtual.next'
    const liveDir = '/tmp/virtual'
    const previousDir = '/tmp/virtual.prev'
    const { publishStagedDir, rename, rm } = await importPublishStagedDirModule({
      existingDirs: [stagedDir, liveDir],
    })

    await publishStagedDir(stagedDir, liveDir)

    expect(rename).toHaveBeenNthCalledWith(1, liveDir, previousDir)
    expect(rename).toHaveBeenNthCalledWith(2, stagedDir, liveDir)
    expect(rm).toHaveBeenCalledTimes(1)
    expect(rm).toHaveBeenCalledWith(previousDir, { recursive: true, force: true })
  })

  it('restores the previous live tree if publishing the staged tree fails', async () => {
    const stagedDir = '/tmp/virtual.next'
    const liveDir = '/tmp/virtual'
    const previousDir = '/tmp/virtual.prev'
    const { publishStagedDir, rename, rm } = await importPublishStagedDirModule({
      existingDirs: [stagedDir, liveDir],
      renameErrorAtCall: 2,
    })

    await expect(publishStagedDir(stagedDir, liveDir)).rejects.toThrow('rename failed')

    expect(rename).toHaveBeenNthCalledWith(1, liveDir, previousDir)
    expect(rename).toHaveBeenNthCalledWith(2, stagedDir, liveDir)
    expect(rename).toHaveBeenNthCalledWith(3, previousDir, liveDir)
    expect(rm).not.toHaveBeenCalledWith(previousDir, { recursive: true, force: true })
  })
})
