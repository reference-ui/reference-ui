import chokidar from 'chokidar'
import { log } from '../utils/log'
import { WATCHER_CONFIG } from './config.internal'
import type { FileChangeHandler, VirtualOptions } from './types'

/**
 * Setup a file watcher for the virtual filesystem.
 * Watches files matching the include patterns and emits events via the handler.
 * 
 * @returns A function to stop the watcher
 */
export async function setupWatcher(
  options: VirtualOptions,
  handler: FileChangeHandler
): Promise<() => void> {
  const { sourceDir, include, debug } = options

  log.debug('[virtual] Setting up file watcher')
  log.debug('[virtual] Watching patterns:', include)

  const watcher = chokidar.watch(include, {
    cwd: sourceDir,
    ...WATCHER_CONFIG
  })

  // Handle file events
  watcher
    .on('add', async (path, stats) => {
      log.debug('[virtual] File added:', path)
      await handler({
        event: 'add',
        path,
        stats
      })
    })
    .on('change', async (path, stats) => {
      log.debug('[virtual] File changed:', path)
      await handler({
        event: 'change',
        path,
        stats
      })
    })
    .on('unlink', async (path) => {
      log.debug('[virtual] File removed:', path)
      await handler({
        event: 'unlink',
        path
      })
    })
    .on('error', (error) => {
      log.error('[virtual] Watcher error:', error)
    })

  // Return cleanup function
  return async () => {
    log.debug('[virtual] Stopping file watcher')
    await watcher.close()
  }
}
