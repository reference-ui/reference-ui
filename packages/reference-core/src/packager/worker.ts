/**
 * Packager worker – bundles and installs packages to outDir.
 * Listens: run:packager:bundle. Logic in run.onRunBundle.
 */
import { emit, on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { onRunBundle } from './run'

export interface PackagerWorkerPayload {
  cwd: string
  watchMode?: boolean
}

export default async function runPackager(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- payload passed to thread as workerData; handler uses getCwd()
  _payload: PackagerWorkerPayload
): Promise<never> {
  on('run:packager:bundle', onRunBundle)
  emit('packager:ready')

  return KEEP_ALIVE
}
