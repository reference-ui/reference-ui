import { runWorker } from '../thread-pool'
import type { ReferenceUIConfig } from '../config'
import { PACKAGES } from '../packager/packages'

export interface InitTsPackagerOptions {
  watch?: boolean
}

/**
 * Initialize packager-ts from main thread.
 * Starts worker that listens for packager:complete, generates .d.ts, emits packager-ts:complete.
 */
export function initTsPackager(
  cwd: string,
  config: ReferenceUIConfig,
  options?: InitTsPackagerOptions
): void {
  if (config.skipTypescript) return

  const packages = PACKAGES.filter(p => p.entry).map(p => ({
    name: p.name,
    sourceEntry: p.entry!,
    outFile: (p.main || './index.js').replace('./', ''),
  }))

  runWorker('packager-ts', {
    cwd,
    config,
    packages,
    watchMode: options?.watch ?? false,
  })
}
