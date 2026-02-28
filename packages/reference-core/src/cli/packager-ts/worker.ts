import { log } from '../lib/log'
import { emit } from '../event-bus'
import { installPackagesTs } from './install'
import type { TsPackagerWorkerPayload } from './types'

/**
 * Run declaration install for packages. Called from worker thread.
 */
export async function runTsPackager(payload: TsPackagerWorkerPayload): Promise<void> {
  const { cwd, packages } = payload

  log.debug('packager:ts', '🔷 Generating TypeScript declarations...')

  try {
    await installPackagesTs(cwd, packages)
    emit('packager-ts:complete', {})
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
