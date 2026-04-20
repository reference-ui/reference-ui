import { existsSync } from 'node:fs'
import { rename, rm } from 'node:fs/promises'

async function removeDirIfPresent(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) return
  await rm(dirPath, { recursive: true, force: true })
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
 * If the second move fails, the previous live tree is restored.
 */
export async function publishStagedDir(stagedDir: string, liveDir: string): Promise<void> {
  const previousDir = `${liveDir}.prev`
  const hadLiveDir = existsSync(liveDir)

  await removeDirIfPresent(previousDir)

  try {
    if (hadLiveDir) {
      await rename(liveDir, previousDir)
    }

    await rename(stagedDir, liveDir)
  } catch (error) {
    if (hadLiveDir && existsSync(previousDir) && !existsSync(liveDir)) {
      await rename(previousDir, liveDir)
    }
    throw error
  }

  await removeDirIfPresent(previousDir)
}
