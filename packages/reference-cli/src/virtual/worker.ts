/**
 * Virtual worker – copies source files to .reference-ui/virtual for Panda scanning.
 * Listens for run:virtual:copy, performs full copy, emits virtual:complete.
 * Emits virtual:ready when handlers are registered.
 */
import { emit, on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { runInitialCopy } from './initial-copy'
import type { VirtualWorkerPayload } from './types'

export default async function runVirtual(payload: VirtualWorkerPayload): Promise<never> {
  const handler = () => {
    runInitialCopy(payload).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[virtual] Copy failed:', err)
    })
  }

  on('run:virtual:copy', handler)
  emit('virtual:ready')

  return KEEP_ALIVE
}
