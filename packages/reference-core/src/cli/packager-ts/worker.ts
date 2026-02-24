import { runTsPackager } from './index'
import type { TsPackagerWorkerPayload } from './types'

/**
 * Worker entry point for TypeScript declaration generation.
 */
export default async function worker(payload: TsPackagerWorkerPayload) {
  return runTsPackager(payload)
}
