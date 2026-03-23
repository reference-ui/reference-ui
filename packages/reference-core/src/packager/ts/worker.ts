import { existsSync } from 'node:fs'
import { emit, on } from '../../lib/event-bus'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { getOutDirPath } from '../../lib/paths/out-dir'
import { getRuntimeEntryPath } from '../layout'
import { createDtsGenerationQueue } from './run'
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
 * Global sync orchestration decides when runtime vs final declarations are
 * needed; the worker only exposes readiness, requests catch-up if runtime
 * bundle outputs already exist, and executes one requested pass at a time.
 */
export default async function runTsPackager(
  payload: TsPackagerWorkerPayload
): Promise<never> {
  const runtimePackages = payload.packages.filter((pkg) => pkg.name !== '@reference-ui/types')
  const queue = createDtsGenerationQueue(payload)

  emit('packager-ts:ready', {})

  if (hasAllBundleOutputs(payload.cwd, runtimePackages)) {
    emit('packager-ts:runtime:requested', {})
  }

  on('run:packager-ts', ({ completionEvent }) => {
    void queue.run(completionEvent)
  })

  return KEEP_ALIVE
}
