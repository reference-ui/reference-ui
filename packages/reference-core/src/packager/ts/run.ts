import { emit } from '../../lib/event-bus'
import { log } from '../../lib/log'
import { installPackagesTs } from './install'
import type { TsPackagerWorkerPayload } from './types'

/** Generate .d.ts and write to outDir. Emits packager-ts:complete when done. */
export async function runDtsGeneration(
  payload: TsPackagerWorkerPayload
): Promise<void> {
  const { cwd, packages } = payload

  log.debug('packager:ts', 'Generating TypeScript declarations...')

  try {
    await installPackagesTs(cwd, packages)
    emit('packager-ts:complete', {})
    log.debug('packager:ts', 'Declarations ready')
  } catch (error) {
    log.error('[packager:ts] Failed', error)
    throw error
  }
}
