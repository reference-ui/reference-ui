import { on } from '../../lib/event-bus'
import { workers } from '../../lib/thread-pool'
import type { SyncPayload } from '../../sync/types'
import { initTsPackagerOrchestrator } from './orchestrator'

export function initTsPackager(payload: SyncPayload): void {
  if (payload.config?.skipTypescript) {
    return
  }

  initTsPackagerOrchestrator()
  workers.runWorker(
    'packager-ts',
    {
      cwd: payload.cwd,
      watchMode: payload.options?.watch,
    },
    { poolName: 'packager-ts' }
  )

  if (payload.options?.watch) {
    on('packager-ts:complete', () => {
      // Placeholder hook for future pool recycle once the child-process compiler lands.
    })
  }
}
