import { log, setDebug } from '../lib/log'
import { initEventBus } from '../lib/event-bus'
import { bootstrap } from './bootstrap'
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
  initEventBus()
  initWatch(payload)


}
