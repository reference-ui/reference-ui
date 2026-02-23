/**
 * Watch worker entry point
 * Runs chokidar in a dedicated worker thread
 */

import chokidar from 'chokidar'
import { log } from '../lib/log'
import { emit } from '../event-bus'
import type { WatchPayload } from './types'

const WATCHER_CONFIG = {
  ignoreInitial: false,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 100,
    pollInterval: 100,
  },
} as const

/**
 * Run file watcher in worker thread
 * Emits 'watch:change' events when files change
 */
export async function runWatch(payload: WatchPayload): Promise<void> {
  const { sourceDir, include, debug = false } = payload

  log.debug('[watch:worker] Starting file watcher')
  log.debug('[watch:worker] Source directory:', sourceDir)
  log.debug('[watch:worker] Watching patterns:', include)

  const watcher = chokidar.watch(include, {
    cwd: sourceDir,
    ...WATCHER_CONFIG,
  })

  let isReady = false

  watcher
    .on('add', async (path, stats) => {
      if (isReady) {
        log.debug('[watch:worker] 📄 File added:', path)
        emit('watch:change', { event: 'add', path, stats })
      } else {
        log.debug('[watch:worker] Initial scan - found:', path)
      }
    })
    .on('change', async (path, stats) => {
      log.debug('[watch:worker] 🔄 File changed:', path)
      emit('watch:change', { event: 'change', path, stats })
    })
    .on('unlink', async path => {
      log.debug('[watch:worker] 🗑️  File removed:', path)
      emit('watch:change', { event: 'unlink', path })
    })
    .on('ready', () => {
      isReady = true
      log.debug('[watch:worker] ✅ Watcher ready and monitoring for changes')
      log.debug('[watch:worker] 👀 Patterns:', include)
      log.debug('[watch:worker] 📂 Directory:', sourceDir)
      emit('watch:ready', { sourceDir, patterns: include })
    })
    .on('error', error => {
      log.error('[watch:worker] Watcher error:', error)
      emit('watch:error', { error: String(error) })
    })

  // Keep worker alive
  return new Promise(() => {})
}

export default runWatch
