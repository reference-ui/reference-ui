/**
 * Dummy worker – listens for sync:changed, emits sync:complete after a delay.
 * Runs in a worker thread so BroadcastChannel delivers events (cross-thread).
 */
import { on, emit } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'

const DELAY_MS = 500

export default async function runDummy(): Promise<never> {
  on('sync:changed', (payload: unknown) => {
    setTimeout(() => {
      emit('sync:complete', payload)
    }, DELAY_MS)
  })
  return KEEP_ALIVE
}
