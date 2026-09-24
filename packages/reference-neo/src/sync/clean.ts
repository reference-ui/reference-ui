// Stale-dir removal: it takes a directory path and emits nothing, retrying
// the recursive remove while the background tasty writer lands files beside
// the wipe. Sync wipes the output dir and the tasty phase writes into it
// after sync returns, so the two overlap by design; a conflicting entry
// fails the remove, and a brief backoff converges once the writer's atomic
// rename lands. Bounded — a stuck writer still fails loud instead of
// wedging sync. An optional preserve list keeps entries (the session lock)
// across a wipe; the failure wipe preserves the lock, releases it, and drops
// the emptied root, so no half-written folder survives (SYNC-11).

import { readdir, rm, rmdir } from 'node:fs/promises'
import { join } from 'node:path'

const CLEAN_ATTEMPTS = 6
const CLEAN_BACKOFF_MS = 5

export interface CleanDirOptions {
  preserve?: string[]
}

function isCleanConflict(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException)?.code
  return code === 'ENOTEMPTY' || code === 'EBUSY' || code === 'EPERM'
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => resolve(undefined), ms)
  })
}

/**
 * Remove a directory tree, retrying while the background tasty phase
 * lands files inside it. Both sync wipes and test teardown remove trees
 * the tasty writer may be extending; without the retry the overlap fails
 * the remove with ENOTEMPTY.
 */
export async function cleanDir(dir: string, options: CleanDirOptions = {}): Promise<void> {
  const preserved = new Set(options.preserve ?? [])
  for (let attempt = 0; attempt < CLEAN_ATTEMPTS; attempt++) {
    try {
      if (preserved.size === 0) {
        await rm(dir, { recursive: true, force: true })
      } else {
        await cleanDirExcept(dir, preserved)
      }
      return
    } catch (error) {
      if (!isCleanConflict(error) || attempt === CLEAN_ATTEMPTS - 1) throw error
      await sleep(CLEAN_BACKOFF_MS * (attempt + 1))
    }
  }
}

// Entry-wise wipe that keeps the preserved names: the session lock survives
// the pre-sync clean so the holder never wipes its own mutex mid-run.
async function cleanDirExcept(dir: string, preserved: Set<string>): Promise<void> {
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return
    throw error
  }
  await Promise.all(
    entries
      .filter((name) => !preserved.has(name))
      .map((name) => rm(join(dir, name), { recursive: true, force: true })),
  )
}

/**
 * Drop a directory only when it is already empty. Best effort by design: a
 * racing newcomer (or the background tasty writer) landing between the wipe
 * and this call owns the dir now, so any failure reads as someone else's
 * folder and stays untouched.
 */
export async function removeDirIfEmpty(dir: string): Promise<void> {
  try {
    await rmdir(dir)
  } catch {
    // Best effort: ENOTEMPTY/ENOENT mean another writer owns or beat us here.
  }
}
