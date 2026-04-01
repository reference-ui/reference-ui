import { workers } from '../lib/thread-pool'
import type { SyncPayload } from '../sync/types'

export function initMcp(payload: SyncPayload): void {
  workers.runWorker(
    'mcp',
    {
      cwd: payload.cwd,
    },
    {
      poolName: 'mcp',
    }
  )
}
