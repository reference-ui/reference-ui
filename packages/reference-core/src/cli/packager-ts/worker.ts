import { on } from '../event-bus'
import { KEEP_ALIVE } from '../thread-pool'
import { runDtsGeneration } from './run'
import type { TsPackagerWorkerPayload } from './types'

/**
 * Packager-ts worker - generates .d.ts from TypeScript source.
 * Listens for packager:complete (bundle done), runs d.ts generation, emits packager-ts:complete.
 */
export async function runTsPackager(payload: TsPackagerWorkerPayload): Promise<void> {
  on('packager:complete', () => runDtsGeneration(payload).catch(() => {}))

  return KEEP_ALIVE
}

export type { TsPackagerWorkerPayload }
export default runTsPackager
