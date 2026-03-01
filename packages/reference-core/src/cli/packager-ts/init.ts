import { runWorker } from '../thread-pool'
import { PACKAGES } from '../packager/packages'
import type { SyncPayload } from '../sync/types'

/**
 * Initialize packager-ts from main thread.
 * Starts worker that listens for packager:complete, generates .d.ts, emits packager-ts:complete.
 */
export function initTsPackager(payload: SyncPayload): void {
  if (payload.config.skipTypescript) return

  const packages = PACKAGES.filter(p => p.entry).map(p => ({
    name: p.name,
    sourceEntry: p.entry!,
    outFile: (p.main || './index.js').replace('./', ''),
  }))

  runWorker('packager-ts', {
    cwd: payload.cwd,
    config: payload.config,
    packages,
    watchMode: payload.options.watch ?? false,
  })
}
