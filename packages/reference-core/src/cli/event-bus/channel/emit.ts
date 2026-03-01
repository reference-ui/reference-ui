import { broadcastChannel } from './channel'
import type { Events } from '../events'

/**
 * Typed emit - sends to BroadcastChannel (all threads see it)
 */
export function emit<K extends keyof Events>(event: K, payload: Events[K]): void
export function emit(event: string, payload?: unknown): void
export function emit(event: string, payload?: unknown) {
  broadcastChannel.postMessage({
    type: 'bus:event',
    event,
    payload,
  })
}
