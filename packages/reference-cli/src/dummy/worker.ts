/**
 * Dummy worker – listens for sync:changed, emits sync:complete after a delay.
 * Runs in a worker thread so BroadcastChannel delivers events (cross-thread).
 * In cold mode, triggerImmediately causes it to emit sync:complete on startup (no race).
 */
import { on, emit } from '../lib/event-bus'
import { KEEP_ALIVE } from '../lib/thread-pool'

const DELAY_MS = 500

export interface DummyPayload {
  triggerImmediately?: boolean
}

export default async function runDummy(payload: DummyPayload = {}): Promise<never> {
  const fire = () => {
    setTimeout(() => emit('sync:complete'), DELAY_MS)
  }

  on('sync:changed', () => fire())

  if (payload.triggerImmediately) {
    fire()
  }

  return KEEP_ALIVE
}
