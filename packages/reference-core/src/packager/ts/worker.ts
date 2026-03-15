import { existsSync } from 'node:fs'
import { on } from '../../lib/event-bus'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { getOutDirPath } from '../../lib/paths/out-dir'
import { getRuntimeEntryPath } from '../layout'
import { createDtsGenerationRuntime } from './run'
import type { TsPackagerWorkerPayload } from './types'

/** True only if every package's bundle output exists (runtime packager has fully completed). */
export function hasAllBundleOutputs(
  cwd: string,
  packages: TsPackagerWorkerPayload['packages']
): boolean {
  const outDir = getOutDirPath(cwd)
  return packages.length > 0 && packages.every((pkg) =>
    existsSync(getRuntimeEntryPath(outDir, pkg.name, pkg.outFile))
  )
}

/**
 * Packager-ts worker – generates .d.ts from TypeScript source.
 * Listens for packager:complete. On startup, runs catch-up only if all runtime package outputs exist
 * (avoids partial generation when init order varies).
 */
export default async function runTsPackager(
  payload: TsPackagerWorkerPayload
): Promise<never> {
  const runtime = createDtsGenerationRuntime(payload, {
    bundlesReady: hasAllBundleOutputs(payload.cwd, payload.packages),
  })

  on('packager:complete', runtime.onPackagerComplete)
  await runtime.runCatchUpIfNeeded()

  return KEEP_ALIVE
}
