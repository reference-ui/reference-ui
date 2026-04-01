import { on, once } from '../lib/event-bus'
import type { SyncPayload } from './types'
import { shutdownAndExit } from './shutdown'

/** Message printed to stdout when ref sync finishes a build (watch mode). Test env scans for this. */
export const REF_SYNC_READY_MESSAGE = '[ref sync] ready\n'

/** Message printed to stderr when ref sync fails (config or Panda). */
export const REF_SYNC_FAILED_MESSAGE = '[ref sync] failed\n'

/**
 * Register the completion listener.
 *
 * We wait for `packager:complete` first, then for the subsequent `mcp:complete`.
 * This avoids treating a stale catch-up declaration pass or stale MCP artifact
 * as readiness for the current sync run.
 *
 * We also listen to worker events directly instead of `sync:complete` because
 * `sync:complete` is emitted from the main thread, and BroadcastChannel does not
 * deliver a message back to the same channel instance that sent it.
 *
 * Failure events are observed directly here because `sync:failed` is emitted by
 * the main thread, and BroadcastChannel does not deliver messages back to the
 * same channel instance that emitted them.
 */
export function initComplete(payload: SyncPayload): void {
  let failureHandled = false

  const handleFailure = () => {
    if (failureHandled) return
    failureHandled = true

    if (!payload.options.watch) {
      void shutdownAndExit(1, 'sync:failed')
    } else {
      process.stderr.write(REF_SYNC_FAILED_MESSAGE)
    }
  }

  once('sync:failed', handleFailure)
  once('system:config:failed', handleFailure)
  once('system:panda:codegen:failed', handleFailure)
  once('virtual:failed', handleFailure)
  once('mcp:failed', handleFailure)

  if (!payload.options.watch) {
    once('packager:complete', () => {
      once('mcp:complete', () => {
        void shutdownAndExit(0, 'sync:complete')
      })
    })
    return
  }

  on('packager:complete', () => {
    once('mcp:complete', () => {
      process.stdout.write(REF_SYNC_READY_MESSAGE)
    })
  })
}
