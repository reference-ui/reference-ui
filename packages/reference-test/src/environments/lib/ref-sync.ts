/**
 * Ref sync readiness for tests. Scans ref-sync.log for the complete message.
 */

import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

/** Must match REF_SYNC_READY_MESSAGE in @reference-ui/core sync/complete.ts */
const REF_SYNC_READY_MESSAGE = '[ref sync] ready'

const REF_SYNC_LOG = 'ref-sync.log'

export interface WaitForRefSyncReadyOptions {
  timeout?: number
  interval?: number
}

/** Poll ref-sync.log for the ready message. Returns when found (fresh since start). */
export async function waitForRefSyncReady(
  sandboxDir: string,
  options?: WaitForRefSyncReadyOptions
): Promise<void> {
  const { timeout = 15_000, interval = 100 } = options ?? {}
  const logPath = join(sandboxDir, REF_SYNC_LOG)
  const deadline = Date.now() + timeout
  const startedAt = Date.now()

  while (Date.now() < deadline) {
    try {
      const s = await stat(logPath)
      if (s.mtimeMs >= startedAt) {
        const content = await readFile(logPath, 'utf-8')
        if (content.includes(REF_SYNC_READY_MESSAGE)) return
      }
    } catch {
      // log missing or unreadable
    }
    await new Promise((r) => setTimeout(r, interval))
  }
  throw new Error(`waitForRefSyncReady timed out after ${timeout}ms`)
}
