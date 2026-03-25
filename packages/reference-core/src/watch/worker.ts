/**
 * Watch worker – monitors file changes with @parcel/watcher, emits events
 * Config comes from workerData (set when pool is created).
 */
import { log } from '../lib/log'
import { emit } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { getWatcherState, startWatcher } from './watcher'
import type { WatchPayload } from './types'

export default async function runWatch(payload: WatchPayload): Promise<never> {
  const { projectRoot } = payload
  const { include, watchRoots } = getWatcherState(payload)

  log.debug(
    'watch',
    `Starting - project: ${projectRoot} roots: ${watchRoots.join(', ')} patterns: ${include.join(', ')}`,
  )

  await startWatcher(payload, {
    onError: (error) => {
      log.error('[watch] Watcher error:', error)
    },
    onChange: ({ event, path, relativePath }) => {
      log.debug('watch', `${event}: ${relativePath}`)
      emit('watch:change', { event, path })
    },
  })

  log.debug('watch', 'Ready - watching for changes')
  return KEEP_ALIVE
}
