import { log } from '../lib/log'
import { buildDeclarations } from './build'
import type { TsPackagerWorkerPayload } from './types'

/**
 * Run declaration build for packages. Called from worker thread.
 */
export async function runTsPackager(payload: TsPackagerWorkerPayload): Promise<void> {
  const { cwd, config, packages } = payload

  log.debug('packager:ts', '🔷 Generating TypeScript declarations...')

  try {
    await buildDeclarations(cwd, packages, config)
  } catch (error) {
    log.debug('packager:ts', 'Error:', error)
    throw error
  }
}

/**
 * Worker entry point for TypeScript declaration generation.
 */
export default async function worker(payload: TsPackagerWorkerPayload) {
  return runTsPackager(payload)
}
