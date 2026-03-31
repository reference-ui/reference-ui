import { workers } from '../../lib/thread-pool'
import { PACKAGES } from '../packages'
import type { SyncPayload } from '../../sync/types'
import { initPackagerTsOrchestrator } from './orchestrator'
export { initPackagerTsOrchestrator } from './orchestrator'

/**
 * Initialize packager-ts from main thread.
 * Starts worker that listens for explicit DTS run requests, generates .d.ts,
 * and emits packager-ts completion events.
 */
export function initTsPackager(payload: SyncPayload): void {
  if (payload.config.skipTypescript) return

  const packages = PACKAGES.filter((p) => p.entry).map((p) => ({
    name: p.name,
    sourceEntry: p.entry!,
    outFile: (p.main || './index.js').replace('./', ''),
  }))

  if (packages.length === 0) return

  initPackagerTsOrchestrator()

  workers.runWorker('packager-ts', {
    cwd: payload.cwd,
    config: payload.config,
    packages,
    watchMode: payload.options.watch ?? false,
  })
}
