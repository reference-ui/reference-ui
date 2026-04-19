import { existsSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'

export const DEFAULT_RESET_DIR_RETRY_DELAYS_MS = [75, 150, 300] as const

const RETRYABLE_REMOVE_ERROR_CODES = new Set(['ENOTEMPTY', 'EBUSY', 'EPERM'])

export interface ResetDirOptions {
  retryDelaysMs?: readonly number[]
}

function isRetryableRemoveError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false
  }

  return RETRYABLE_REMOVE_ERROR_CODES.has(String(error.code))
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Replace a directory with a fresh empty one.
 *
 * This is a shared filesystem primitive because transient recursive-delete
 * failures are not specific to virtual sync. Across platforms, a short race with
 * a watcher, indexer, antivirus process, or still-closing handle can surface as:
 *
 * - `ENOTEMPTY` when a child entry reappears during directory traversal
 * - `EBUSY` when the OS still considers part of the tree busy
 * - `EPERM` most commonly on Windows when deletion races with another process
 *
 * We retry only those short-lived cases with a bounded backoff, then rethrow so
 * persistent permission or filesystem problems remain visible.
 */
export async function resetDir(
  dirPath: string,
  options: ResetDirOptions = {},
): Promise<void> {
  const retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RESET_DIR_RETRY_DELAYS_MS

  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true })
    return
  }

  for (let attempt = 0; ; attempt += 1) {
    try {
      await rm(dirPath, { recursive: true, force: true })
      break
    } catch (error) {
      if (!isRetryableRemoveError(error) || attempt >= retryDelaysMs.length) {
        throw error
      }

      await wait(retryDelaysMs[attempt] ?? 0)
    }
  }

  await mkdir(dirPath, { recursive: true })
}