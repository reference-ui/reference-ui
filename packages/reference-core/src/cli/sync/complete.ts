import { on, onceAll } from '../event-bus'
import type { SyncPayload } from './types'

/** Message printed to stdout when ref sync finishes a build (watch mode). Test env scans for this. */
export const REF_SYNC_READY_MESSAGE = '[ref sync] ready'

/** Register listener for cold sync gates. When all fire, exits process. No-op in watch mode. */
export function initSyncComplete(payload: SyncPayload): void {
  const event =
    payload.config.skipTypescript === true ? 'packager:complete' : 'packager-ts:complete'

  if (payload.options.watch) {
    on(event, () => {
      process.stdout.write(REF_SYNC_READY_MESSAGE + '\n')
    })
    return
  }

  const gates =
    payload.config.skipTypescript === true
      ? ['packager:complete']
      : ['packager:complete', 'packager-ts:complete']
  onceAll(gates, () => process.exit(0))
}
