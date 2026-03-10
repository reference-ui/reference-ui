import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { on } from '../../lib/event-bus'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { getOutDirPath } from '../../lib/paths/out-dir'
import { getShortName } from '../package/name'
import { runDtsGeneration } from './run'
import type { TsPackagerWorkerPayload } from './types'

/** True if bundle output exists (packager has run). Derived from filesystem, not events. */
function hasBundleOutput(
  cwd: string,
  packages: TsPackagerWorkerPayload['packages']
): boolean {
  const outDir = getOutDirPath(cwd)
  return packages.some((pkg) => {
    const shortName = getShortName(pkg.name)
    const outPath = join(outDir, shortName, pkg.outFile)
    return existsSync(outPath)
  })
}

/**
 * Packager-ts worker – generates .d.ts from TypeScript source.
 * Listens for packager:complete. On startup, runs catch-up if bundle already exists
 * (handles init-order independence without coordination events).
 */
export default async function runTsPackager(
  payload: TsPackagerWorkerPayload
): Promise<never> {
  on('packager:complete', () => runDtsGeneration(payload).catch(() => {}))

  if (hasBundleOutput(payload.cwd, payload.packages)) {
    await runDtsGeneration(payload).catch(() => {})
  }

  return KEEP_ALIVE
}
