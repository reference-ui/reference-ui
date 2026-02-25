/**
 * Watch worker entry point
 * Watches files with @parcel/watcher, logs changes
 */

import { subscribe } from '@parcel/watcher'
import { relative } from 'node:path'
import picomatch from 'picomatch'
import { log } from '../lib/log'
import { emit } from '../event-bus'
import type { WatchPayload } from './types'

const EVENT_MAP = { create: 'add' as const, update: 'change' as const, delete: 'unlink' as const }

/**
 * Run file watcher in worker thread
 * Watches sourceDir for changes matching include patterns, logs them
 */
export async function runWatch(payload: WatchPayload): Promise<void> {
  const { sourceDir, config } = payload
  const { include } = config

  log.debug(`[watch] Starting - source: ${sourceDir} patterns: ${include.join(', ')}`)

  const isMatch = picomatch(include)

  await subscribe(
    sourceDir,
    (err, events) => {
      if (err) {
        log.error('[watch] Watcher error:', err)
        emit('watch:error', { error: String(err) })
        return
      }

      for (const ev of events) {
        const relPath = relative(sourceDir, ev.path)
        if (!isMatch(relPath)) continue
        const mapped = EVENT_MAP[ev.type]
        log.debug(`[watch] ${mapped}: ${relPath}`)
        emit('watch:change', { event: mapped, path: ev.path })
      }
    },
    { ignore: ['**/node_modules/**'] }
  )

  log.debug('[watch] Ready - watching for changes')
  emit('watch:ready', { sourceDir, patterns: include })

  return new Promise(() => {})
}

export default runWatch
