import { on } from '../lib/event-bus'
import { getOutDirPath } from '../lib/paths'
import type { SyncPayload } from '../sync/types'
import {
  initSessionState,
  transitionSession,
  transitionBuild,
  cleanupSession,
} from './state'
import { readLock, isLockStale } from './files'
import { log } from '../lib/log'

const LOG_SCOPE = 'session'

/**
 * Initialize the session module for a sync run.
 *
 * - In watch mode: acquires the session lock, failing fast if another live
 *   watch process already owns the outDir.
 * - In one-shot mode: skips the lock (one-shot runs are transient and may
 *   legitimately run alongside a watch process, e.g. to apply config changes).
 * - Writes the initial `session.json` manifest.
 * - Subscribes to sync pipeline events to keep manifest state current.
 * - Cleans up the lock on orderly exit.
 */
export function initSession(payload: SyncPayload): void {
  const outDir = getOutDirPath(payload.cwd)
  const mode = payload.options.watch ? 'watch' : 'one-shot'

  // Only enforce single-writer for watch mode. Two concurrent watch processes
  // on the same outDir would stomp each other's outputs, so we fail fast.
  // One-shot syncs are transient and safe to run alongside a watch process.
  if (payload.options.watch) {
    const existingLock = readLock(outDir)
    if (existingLock !== null) {
      if (!isLockStale(existingLock)) {
        log.error(
          LOG_SCOPE,
          `Another ref sync --watch process (pid ${existingLock.pid}) already owns ${outDir}. ` +
            'Use a different outDir to run parallel watch sessions.'
        )
        process.exit(1)
      }
      log.debug(LOG_SCOPE, `Reclaiming stale watch lock from pid ${existingLock.pid}`)
    }
  }

  initSessionState(outDir, mode)

  // Initial virtual copy marks the pipeline as live.
  on('virtual:complete', () => {
    transitionSession(payload.options.watch ? 'watching' : 'starting')
    transitionBuild('running')
  })

  // Watch-mode cycle: a file change queues a new build.
  on('watch:change', () => {
    if (payload.options.watch) transitionBuild('queued')
  })

  // Virtual sync for a single file starts the running phase.
  on('run:virtual:sync:file', () => {
    if (payload.options.watch) transitionBuild('running')
  })

  // Packager completion is the safe-to-refresh point for bundlers.
  on('packager:complete', () => {
    transitionBuild('ready')
  })

  // Any pipeline failure is reflected in the manifest.
  on('sync:failed', () => {
    transitionBuild('failed')
    transitionSession('failed')
  })

  if (!payload.options.watch) {
    // In one-shot mode, clean up the lock once the run is fully done.
    on('sync:complete', () => {
      cleanupSession()
    })
  }
}
