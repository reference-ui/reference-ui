import { onceAll } from '../event-bus'
import type { SyncPayload } from './types'

/** Register listener for cold sync gates. When all fire, exits process. No-op in watch mode. */
export function initSyncComplete(payload: SyncPayload): void {
  if (payload.options.watch) return

  const gates =
    payload.config.skipTypescript === true
      ? ['packager:complete']
      : ['packager:complete', 'packager-ts:complete']
  onceAll(gates, () => process.exit(0))
}
