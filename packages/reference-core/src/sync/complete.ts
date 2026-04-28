import { on, once } from '../lib/event-bus'
import { logPackagesBuilt } from '../packager/logging'
import type { SyncPayload } from './types'
import { initWatchReady } from './watch-ready'
import {
  logSyncDone,
  logSyncFailure,
  logSyncMilestone,
  logSyncReady,
  markSyncCycleStart,
  REF_SYNC_FAILED_MESSAGE,
} from './logging'
import { shutdownAndExit } from './shutdown'

export { REF_SYNC_FAILED_MESSAGE }

/**
 * Register the completion listener.
 *
 * In one-shot mode, shutdown runs after final library declarations
 * (`packager-ts:complete`). `packager:complete` is logged separately when the
 * bundle finishes (before the final DTS pass). MCP is out of band: `ref mcp`
 * builds its own model when the editor starts that server.
 *
 * In watch mode, readiness is tied to both generated CSS and the exported
 * runtime package surface becoming usable. The dev server and browser can
 * refresh once the stylesheet has been regenerated and the runtime package copy
 * is on disk; TypeScript declarations, reference/Tasty output, and final
 * `@reference-ui/types` packaging continue in the background.
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

  on('virtual:complete', () => {
    logSyncMilestone('Prepared virtual workspace')
  })

  on('system:config:complete', () => {
    logSyncMilestone('Generated system config')
  })

  on('system:panda:codegen', () => {
    logSyncMilestone('Generated Panda output')
  })

  on('packager:runtime:complete', ({ packageCount, durationMs }) => {
    logPackagesBuilt(packageCount, durationMs)
  })

  on('packager-ts:runtime:complete', () => {
    logSyncMilestone('Generated runtime TypeScript declarations')
  })

  on('packager-ts:complete', () => {
    logSyncMilestone('Generated library TypeScript declarations')
  })

  if (!payload.options.watch) {
    on('packager:complete', ({ packageCount, durationMs }) => {
      logPackagesBuilt(packageCount, durationMs)
    })
    once('packager-ts:complete', () => {
      logSyncDone()
      void shutdownAndExit(0, 'sync:complete')
    })
    return
  }

  on('packager:complete', ({ packageCount, durationMs }) => {
    logPackagesBuilt(packageCount, durationMs)
  })

  initWatchReady({
    onCycleStart: markSyncCycleStart,
    onReady: logSyncReady,
  })
}
