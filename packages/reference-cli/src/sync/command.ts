import { emit } from '../lib/event-bus'
import { setDebug } from '../lib/log'
import { initDummyWorker } from '../dummy/init'
import { bootstrap } from './bootstrap'
import { initEvents } from './events'
import { initWatch } from '../watch/init'
import type { SyncOptions } from './types'

export type { SyncOptions, SyncPayload } from './types'

/**
 * Sync command – main hub for the design system build pipeline.
 * Owns event flow, worker orchestration, and pipeline coordination.
 */
export async function syncCommand(
  cwd: string,
  options?: SyncOptions
): Promise<void> {
  const payload = await bootstrap(cwd, options)
  if (payload.config.debug) setDebug(true)
  initEvents(payload.options) // hub – mount first so all downstream handlers are ready
  initWatch(payload)
  initDummyWorker()
  if (!payload.options.watch) {
    setTimeout(() => emit('sync:changed', {}), 100)
  }
}
