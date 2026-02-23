/**
 * Watch worker entry point
 * Thin wrapper around chokidar - just watches files and emits events
 */

import chokidar from 'chokidar'
import { log } from '../lib/log'
import { emit } from '../event-bus'
import type { WatchPayload } from './types'

const WATCHER_CONFIG = {
  ignoreInitial: true, // Don't trigger on startup, only on actual changes
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 100,
    pollInterval: 100,
  },
} as const

/**
 * Run file watcher in worker thread
 * Just watches and emits events - nothing else
 */
export async function runWatch(payload: WatchPayload): Promise<void> {
  const { sourceDir, config } = payload
  const { include } = config

  log.debug('[watch] Starting file watcher')
  log.debug('[watch] Source:', sourceDir)
  log.debug('[watch] Patterns:', include)

  const watcher = chokidar.watch(include, {
    cwd: sourceDir,
    ...WATCHER_CONFIG,
  })

  watcher
    .on('add', (path, stats) => {
      log.debug('[watch] File added:', path)
      emit('watch:change', { event: 'add', path, stats })
    })
    .on('change', (path, stats) => {
      log.debug('[watch] File change:', path)
      emit('watch:change', { event: 'change', path, stats })
    })
    .on('unlink', path => {
      log.debug('[watch] File removed:', path)
      emit('watch:change', { event: 'unlink', path })
    })
    .on('ready', () => {
      log.debug('[watch] Ready - watching for changes')
      emit('watch:ready', { sourceDir, patterns: include })
    })
    .on('error', error => {
      log.error('[watch] Watcher error:', error)
      emit('watch:error', { error: String(error) })
    })

  // Keep worker alive
  return new Promise(() => {})
}

export default runWatch
