/**
 * Watch worker – monitors file changes with @parcel/watcher, emits events
 */
import { subscribe } from '@parcel/watcher'
import { relative } from 'node:path'
import picomatch from 'picomatch'
import { log } from '../lib/log'
import { emit } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import type { WatchPayload } from './types'

const EVENT_MAP = {
  create: 'add' as const,
  update: 'change' as const,
  delete: 'unlink' as const,
}

export default async function runWatch(payload: WatchPayload): Promise<never> {
  const { sourceDir, config } = payload
  const { include } = config

  log.debug('watch', `Starting - source: ${sourceDir} patterns: ${include.join(', ')}`)

  const isMatch = picomatch(include)

  await subscribe(
    sourceDir,
    (err, events) => {
      if (err) {
        log.error('[watch] Watcher error:', err)
        return
      }
      for (const ev of events) {
        const relPath = relative(sourceDir, ev.path)
        if (!isMatch(relPath)) continue
        const mapped = EVENT_MAP[ev.type as keyof typeof EVENT_MAP]
        log.debug('watch', `${mapped}: ${relPath}`)
        emit('watch:change', { event: mapped, path: ev.path })
      }
    },
    { ignore: ['**/node_modules/**'] }
  )

  log.debug('watch', 'Ready - watching for changes')
  return KEEP_ALIVE
}
