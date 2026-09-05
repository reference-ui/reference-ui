/**
 * Watch worker – monitors file changes with @parcel/watcher, emits events
 * Config comes from workerData (set when pool is created).
 */
import { log } from '../lib/log'
import { emit } from '../lib/event-bus'
import { startWorkerMemoryReporter } from '../lib/profiler'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { getWatcherState, startWatcher } from './watcher'
import type { WatchPayload } from './types'

export function isFSEventsDroppedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('Events were dropped')
}

export function createWatcherErrorHandler(
  projectRoot: string,
  emitFn: (event: 'watch:change', payload: { event: 'change'; path: string; requiresFullResync: true }) => void = emit,
  options: { minResyncIntervalMs?: number; maxConsecutiveErrors?: number } = {},
): (error: Error) => void {
  const minInterval = options.minResyncIntervalMs ?? 5000
  const maxConsecutive = options.maxConsecutiveErrors ?? 3
  let lastResyncTime = 0
  let consecutiveErrorCount = 0

  return (error: Error) => {
    // macOS FSEvents queue buffer overflow occurs during high-volume build writes (e.g. in .reference-ui).
    // The watcher remains functional and continues receiving real file events.
    // Firing a full re-sync here triggers more build writes and creates an infinite loop.
    if (isFSEventsDroppedError(error)) {
      log.warn('[watch] OS file system event buffer dropped events under heavy write activity; watcher remains active.')
      return
    }

    const now = Date.now()
    if (now - lastResyncTime < minInterval) {
      log.warn('[watch] Suppressing rapid watcher error re-sync (within cooldown):', error.message)
      return
    }

    consecutiveErrorCount++
    if (consecutiveErrorCount > maxConsecutive) {
      log.error(
        `[watch] Watcher error circuit breaker triggered after ${maxConsecutive} consecutive failures. Stopping automatic re-sync:`,
        error,
      )
      return
    }

    lastResyncTime = now
    log.warn('[watch] Watcher error – triggering full re-sync:', error)
    emitFn('watch:change', { event: 'change', path: projectRoot, requiresFullResync: true })
  }
}

export default async function runWatch(payload: WatchPayload): Promise<never> {
  startWorkerMemoryReporter('watch')
  const { projectRoot } = payload
  const { include, watchRoots } = getWatcherState(payload)

  log.debug(
    'watch',
    `Starting - project: ${projectRoot} roots: ${watchRoots.join(', ')} patterns: ${include.join(', ')}`,
  )

  const onError = createWatcherErrorHandler(projectRoot)

  await startWatcher(payload, {
    onError,
    onChange: ({ event, path, relativePath, requiresFullResync }) => {
      log.debug('watch', `${event}: ${relativePath}`)
      emit('watch:change', { event, path, requiresFullResync })
    },
  })

  log.debug('watch', 'Ready - watching for changes')
  return KEEP_ALIVE
}
