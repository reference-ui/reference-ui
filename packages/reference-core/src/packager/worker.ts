/**
 * Packager worker – bundles and installs packages to outDir.
 * Listens: run:packager:bundle. Logic in run.onRunBundle.
 */
import { emit, on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { onRunBundle, onRunRuntimeBundle } from './run'

export interface PackagerWorkerPayload {
  cwd: string
  watchMode?: boolean
  skipTypescript?: boolean
}

export default async function runPackager(
  payload: PackagerWorkerPayload
): Promise<never> {
  on('run:packager:runtime:bundle', () => onRunRuntimeBundle(payload))
  on('run:packager:bundle', () => onRunBundle(payload))
  emit('packager:ready')

  return KEEP_ALIVE
}
