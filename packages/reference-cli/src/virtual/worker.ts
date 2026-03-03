/**
 * Virtual worker – copies source files to .reference-ui/virtual for Panda scanning.
 * Listens for sync:changed, performs full copy, emits virtual:complete.
 * Config comes from workerData (set when pool is created).
 */
import { on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { runInitialCopy } from './logic'
import type { VirtualWorkerPayload } from './types'

export default async function runVirtual(payload: VirtualWorkerPayload): Promise<never> {
  const handler = () => {
    runInitialCopy(payload).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[virtual] Copy failed:', err)
    })
  }

  on('sync:changed', handler)

  // Cold sync: run immediately
  handler()

  return KEEP_ALIVE
}
