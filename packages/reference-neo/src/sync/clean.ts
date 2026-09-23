// Stale-dir removal: it takes a directory path and emits nothing, retrying
// the recursive remove while the background tasty writer lands files beside
// the wipe. Sync wipes the output dir and the tasty phase writes into it
// after sync returns, so the two overlap by design; a conflicting entry
// fails the remove, and a brief backoff converges once the writer's atomic
// rename lands. Bounded — a stuck writer still fails loud instead of
// wedging sync.

import { rm } from 'node:fs/promises'

const CLEAN_ATTEMPTS = 6
const CLEAN_BACKOFF_MS = 5

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
export async function cleanDir(dir: string): Promise<void> {
  for (let attempt = 0; attempt < CLEAN_ATTEMPTS; attempt++) {
    try {
      await rm(dir, { recursive: true, force: true })
      return
    } catch (error) {
      if (!isCleanConflict(error) || attempt === CLEAN_ATTEMPTS - 1) throw error
      await sleep(CLEAN_BACKOFF_MS * (attempt + 1))
    }
  }
}
