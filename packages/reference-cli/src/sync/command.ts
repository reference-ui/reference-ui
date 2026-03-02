import { initDummyWorker } from '../dummy/init'
import { bootstrap } from './bootstrap'
import { initEvents } from './events'
import { initWatch } from '../watch/init'
import type { SyncOptions } from './types'

export type { SyncOptions, SyncPayload } from './types'

/** Sync command – main hub for the design system build pipeline. */
export async function syncCommand(cwd: string, options?: SyncOptions): Promise<void> {
  const payload = await bootstrap(cwd, options)
  initEvents(payload)
  initWatch(payload)
  initDummyWorker(payload)
}
