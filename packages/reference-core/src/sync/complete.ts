import { once } from '../lib/event-bus'
import type { SyncPayload } from './types'

/** Message printed to stdout when ref sync finishes a build (watch mode). Test env scans for this. */
export const REF_SYNC_READY_MESSAGE = '[ref sync] ready\n'

/**
 * Register the completion listener.
 *
 * We wait for `packager:complete` first, then for the subsequent
 * `packager-ts:complete`. This avoids treating a stale catch-up declaration pass
 * as readiness for the current sync run.
 *
 * We also listen to worker events directly instead of `sync:complete` because
 * `sync:complete` is emitted from the main thread, and BroadcastChannel does not
 * deliver a message back to the same channel instance that sent it.
 */
export function initComplete(payload: SyncPayload): void {
  once('packager:complete', () => {
    once('packager-ts:complete', () => {
      if (!payload.options.watch) {
        process.exit(0)
      } else {
        process.stdout.write(REF_SYNC_READY_MESSAGE)
      }
    })
  })
}
