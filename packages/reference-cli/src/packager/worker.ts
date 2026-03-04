/**
 * Packager worker – bundles and installs packages to outDir.
 *
 * Listens: run:packager:bundle
 * In watch mode, stays alive and listens for additional bundle triggers.
 */
import { emit, on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { log } from '../lib/log'
import { runBundle } from './run'

export interface PackagerWorkerPayload {
  cwd: string
  watchMode?: boolean
}

export default async function runPackager(payload: PackagerWorkerPayload): Promise<never> {
  const { cwd } = payload

  const onBundle = () => {
    runBundle({ cwd }).catch((err) => {
      log.error('[packager] Bundle failed:', err)
    })
  }

  on('run:packager:bundle', onBundle)
  emit('packager:ready')

  return KEEP_ALIVE
}
