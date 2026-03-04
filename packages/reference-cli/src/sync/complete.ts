import { once } from '../lib/event-bus'
import type { SyncPayload } from './types'

/** Message printed to stdout when ref sync finishes a build (watch mode). Test env scans for this. */
export const REF_SYNC_READY_MESSAGE = '[ref sync] ready\n'

/** Register listener for sync:complete. Exits in cold mode; writes ready message in watch mode. */
export function initComplete(payload: SyncPayload): void {
  once('sync:complete', () => {
    if (!payload.options.watch) {
      process.exit(0)
    } else {
      process.stdout.write(REF_SYNC_READY_MESSAGE)
    }
  })
}
