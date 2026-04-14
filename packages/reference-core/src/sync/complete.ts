import { on, once } from '../lib/event-bus'
import { logPackagesBuilt } from '../packager/logging'
import type { SyncPayload } from './types'
import {
  logSyncDone,
  logSyncFailure,
  logSyncReady,
  markSyncCycleStart,
  REF_SYNC_FAILED_MESSAGE,
} from './logging'
import { shutdownAndExit } from './shutdown'

export { REF_SYNC_FAILED_MESSAGE }

/**
 * Register the completion listener.
 *
 * In one-shot mode, we wait for `packager:complete` first, then for the
 * subsequent `mcp:complete`. This avoids treating a stale catch-up declaration
 * pass or stale MCP artifact as completion for the current sync run.
 *
 * In watch mode, readiness is tied to the packager output instead of MCP. The
 * dev server and browser only depend on the packaged artifacts, and gating the
 * ready signal on MCP causes unnecessary watch-mode stalls.
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

    logSyncFailure(payload)

    if (!payload.options.watch) {
      void shutdownAndExit(1, 'sync:failed')
    }
  }

  once('sync:failed', handleFailure)
  once('system:config:failed', handleFailure)
  once('system:panda:codegen:failed', handleFailure)
  once('virtual:failed', handleFailure)
  once('mcp:failed', handleFailure)

  on('packager:runtime:complete', ({ packageCount, durationMs }) => {
    logPackagesBuilt(packageCount, durationMs)
  })

  if (!payload.options.watch) {
    once('packager:complete', ({ packageCount, durationMs }) => {
      logPackagesBuilt(packageCount, durationMs)
      once('mcp:complete', () => {
        logSyncDone()
        void shutdownAndExit(0, 'sync:complete')
      })
    })
    return
  }

  /**
   * Normal watch-mode rebuilds complete when the full packager bundle finishes.
   * Also mark the cold-start as done so incremental fragment paths know they
   * can start emitting ready signals.
   */
  let initialSyncComplete = false
  let fragmentPending = false

  on('virtual:fragment:change', () => {
    fragmentPending = true
  })

  on('watch:change', () => {
    markSyncCycleStart()
  })

  on('packager:complete', ({ packageCount, durationMs }) => {
    logPackagesBuilt(packageCount, durationMs)
    initialSyncComplete = true
    fragmentPending = false
    logSyncReady()
  })

  /**
   * Fragment-only changes (tokens(), keyframes(), etc.) skip the reference
   * build and go through config → panda codegen → packager runtime bundle
   * (runtime CSS + JS only — no reference/MCP pass).
   * Emit ready once the runtime bundle is on disk so test consumers that do a
   * fresh page load see the updated token values.
   * Guard on initialSyncComplete to avoid a premature signal during cold start.
   */
  on('packager:runtime:complete', () => {
    if (!initialSyncComplete || !fragmentPending) return
    fragmentPending = false
    logSyncReady()
  })
}
