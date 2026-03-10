import { broadcastChannel } from './channel'
import type { Events } from '../../../events'

/**
 * Typed emit - sends to BroadcastChannel (all threads see it).
 * For empty-payload events (Record<string, never>), payload is omitted.
 */
export function emit<K extends keyof Events>(
  event: K,
  ...args: Events[K] extends Record<string, never> ? [] : [payload: Events[K]]
): void
export function emit(event: string, payload?: unknown): void
export function emit(event: string, payload?: unknown) {
  broadcastChannel.postMessage({
    type: 'bus:event',
    event,
    payload: payload ?? {},
  })
}
