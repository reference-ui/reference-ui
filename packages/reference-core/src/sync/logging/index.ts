import { emitLog } from '../../lib/log'
import type { SyncPayload } from '../types'

const SYNC_BADGE = 'ref'
const SYNC_MODULE = 'sync'

export const REF_SYNC_FAILED_MESSAGE = '[ref sync] failed\n'

let syncStartedAt = 0
let cycleStartedAt = 0
/** Wall clock for “step N took … since previous step” lines (reset on cold start and each watch cycle). */
let phaseAnchor = 0

function formatElapsed(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(durationMs >= 10_000 ? 1 : 2)}s`
}

function ensureSyncTimers(): number {
  const now = Date.now()

  if (syncStartedAt === 0) {
    syncStartedAt = now
  }

  if (cycleStartedAt === 0) {
    cycleStartedAt = now
  }

  return now
}

export function startSyncLogging(): void {
  const now = Date.now()
  syncStartedAt = now
  cycleStartedAt = now
  phaseAnchor = now

  emitLog(
    'info',
    ['Starting CLI'],
    {
      badge: SYNC_BADGE,
      module: SYNC_MODULE,
    }
  )
}

export function markSyncCycleStart(): void {
  const now = Date.now()
  cycleStartedAt = now
  phaseAnchor = now
}

/**
 * User-facing step timing (e.g. TypeScript declaration passes). Each call logs duration since the
 * previous milestone (or since cycle start after `markSyncCycleStart`).
 */
export function logSyncMilestone(message: string): void {
  const now = Date.now()
  const elapsed = now - phaseAnchor
  phaseAnchor = now
  emitLog('info', [`${message} in ${formatElapsed(elapsed)}`], {
    badge: SYNC_BADGE,
    module: SYNC_MODULE,
  })
}

export function logSyncReady(): void {
  const now = ensureSyncTimers()

  emitLog('info', [`Ready in ${formatElapsed(now - cycleStartedAt)}`], {
    badge: SYNC_BADGE,
    module: SYNC_MODULE,
  })
}

export function logSyncDone(): void {
  const now = ensureSyncTimers()

  emitLog('info', [`Sync complete in ${formatElapsed(now - syncStartedAt)}`], {
    badge: SYNC_BADGE,
    module: SYNC_MODULE,
  })
}

export function logSyncFailure(payload: SyncPayload): void {
  emitLog(
    payload.options.watch ? 'warn' : 'error',
    [
      payload.options.watch
        ? 'Build failed. Waiting for the next change.'
        : 'Build failed. Shutting down sync.',
    ],
    {
      badge: SYNC_BADGE,
      module: SYNC_MODULE,
      label: 'failed',
    }
  )

  if (payload.options.watch) {
    process.stderr.write(REF_SYNC_FAILED_MESSAGE)
  }
}