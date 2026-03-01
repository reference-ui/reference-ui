import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { on } from '../event-bus'
import { KEEP_ALIVE } from '../thread-pool'
import { runDtsGeneration } from './run'
import type { TsPackagerWorkerPayload } from './types'

/** True if bundle output exists (packager has run). Derived from filesystem, not events. */
function hasBundleOutput(cwd: string, packages: TsPackagerWorkerPayload['packages']): boolean {
  return packages.some(pkg => {
    const outPath = join(cwd, 'node_modules', pkg.name, pkg.outFile)
    return existsSync(outPath)
  })
}

/**
 * Packager-ts worker - generates .d.ts from TypeScript source.
 * Listens for packager:complete. On startup, runs catch-up if bundle already exists
 * (handles init-order independence without coordination events).
 */
export async function runTsPackager(payload: TsPackagerWorkerPayload): Promise<void> {
  on('packager:complete', () => runDtsGeneration(payload).catch(() => {}))

  if (hasBundleOutput(payload.cwd, payload.packages)) {
    await runDtsGeneration(payload).catch(() => {})
  }

  return KEEP_ALIVE
}

export type { TsPackagerWorkerPayload }
export default runTsPackager
