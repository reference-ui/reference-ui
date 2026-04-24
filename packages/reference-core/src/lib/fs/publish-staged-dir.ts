import { existsSync } from 'node:fs'
import { cp, rename, rm } from 'node:fs/promises'

function isExdevError(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'EXDEV')
}

async function removeDirIfPresent(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) return
  await rm(dirPath, { recursive: true, force: true })
}

async function replaceDirByCopy(stagedDir: string, liveDir: string): Promise<void> {
  await removeDirIfPresent(liveDir)
  await cp(stagedDir, liveDir, { recursive: true })
  await removeDirIfPresent(stagedDir)
}

async function moveLiveDirAside(liveDir: string, previousDir: string): Promise<boolean> {
  try {
    await rename(liveDir, previousDir)
    return true
  } catch (error) {
    if (!isExdevError(error)) {
      throw error
    }

    return false
  }
}

async function publishStagedTree(stagedDir: string, liveDir: string): Promise<void> {
  try {
    await rename(stagedDir, liveDir)
  } catch (error) {
    if (!isExdevError(error)) {
      throw error
    }

    await replaceDirByCopy(stagedDir, liveDir)
  }
}

async function restorePreviousDirIfNeeded(previousDir: string, liveDir: string): Promise<void> {
  if (!existsSync(previousDir) || existsSync(liveDir)) {
    return
  }

  await rename(previousDir, liveDir)
}

/**
 * Publish a fully prepared directory into its live location.
 *
 * We cannot atomically replace a non-empty directory on all supported
 * platforms, so publish proceeds in a narrow swap window:
 *
 * 1. move the current live tree aside
 * 2. move the staged tree into the live path
 * 3. remove the previous tree after the new one is visible
 *
 * If a rename crosses filesystems (`EXDEV`), we fall back to copying the
 * staged tree into place. If publishing fails after the live tree was moved
 * aside, the previous live tree is restored.
 */
export async function publishStagedDir(stagedDir: string, liveDir: string): Promise<void> {
  const previousDir = `${liveDir}.prev`
  const hadLiveDir = existsSync(liveDir)

  await removeDirIfPresent(previousDir)

  try {
    if (hadLiveDir && !(await moveLiveDirAside(liveDir, previousDir))) {
      await replaceDirByCopy(stagedDir, liveDir)
      return
    }

    await publishStagedTree(stagedDir, liveDir)
  } catch (error) {
    if (hadLiveDir) {
      await restorePreviousDirIfNeeded(previousDir, liveDir)
    }
    throw error
  } finally {
    await removeDirIfPresent(previousDir)
  }
}
