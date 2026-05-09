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

export default async function runWatch(payload: WatchPayload): Promise<never> {
  startWorkerMemoryReporter('watch')
  const { projectRoot } = payload
  const { include, watchRoots } = getWatcherState(payload)

  log.debug(
    'watch',
    `Starting - project: ${projectRoot} roots: ${watchRoots.join(', ')} patterns: ${include.join(', ')}`,
  )

  await startWatcher(payload, {
    onError: (error) => {
      // @parcel/watcher surfaces a recoverable error when the OS event queue
      // overflows (e.g. macOS FSEvents "Events were dropped" right after the
      log.warn('[watch] Watcher error – triggering full re-sync:', error)
      emit('watch:change', { event: 'change', path: projectRoot, requiresFullResync: true })
    },
    onChange: ({ event, path, relativePath, requiresFullResync }) => {
      log.debug('watch', `${event}: ${relativePath}`)
      emit('watch:change', { event, path, requiresFullResync })
    },
  })

  log.debug('watch', 'Ready - watching for changes')
  return KEEP_ALIVE
}
