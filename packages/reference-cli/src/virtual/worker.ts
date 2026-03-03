/**
 * Virtual worker – copies source files to .reference-ui/virtual for Panda scanning.
 * Listens for run:virtual:copy:all, performs full copy, emits virtual:complete.
 * Emits virtual:ready when handlers are registered.
 */
import { emit, on } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'
import { copyAll } from './copy-all'
import type { VirtualWorkerPayload } from './types'

export default async function runVirtual(payload: VirtualWorkerPayload): Promise<never> {
  const handler = () => {
    copyAll(payload).catch((err) => {
      console.error('[virtual] Copy failed:', err)
    })
  }

  on('run:virtual:copy:all', handler)
  emit('virtual:ready')

  return KEEP_ALIVE
}
