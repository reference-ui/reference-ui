import { broadcastChannel, channelListeners } from './channel'
import type { Events } from '../../../events'

/**
 * Typed on - listens on BroadcastChannel (works in any thread)
 */
export function on<K extends keyof Events>(
  event: K,
  handler: (payload: Events[K]) => void | Promise<void>
): void
export function on(event: string, handler: (payload: unknown) => void | Promise<void>): void
export function on(event: string, handler: (payload: unknown) => void | Promise<void>) {
  const listener = (msg: Event) => {
    if ((msg as MessageEvent).data?.type === 'bus:event' && (msg as MessageEvent).data?.event === event) {
      handler((msg as MessageEvent).data.payload)
    }
  }

  broadcastChannel.addEventListener('message', listener as EventListener)

  if (!channelListeners.has(event)) {
    channelListeners.set(event, new Set())
  }
  channelListeners.get(event)!.add(listener)
}

/**
 * Typed once - listens once on BroadcastChannel (works in any thread)
 */
export function once<K extends keyof Events>(
  event: K,
  handler: (payload: Events[K]) => void | Promise<void>
): void
export function once(event: string, handler: (payload: unknown) => void | Promise<void>): void
export function once(event: string, handler: (payload: unknown) => void | Promise<void>) {
  const listener = (msg: Event) => {
    if ((msg as MessageEvent).data?.type === 'bus:event' && (msg as MessageEvent).data?.event === event) {
      broadcastChannel.removeEventListener('message', listener as EventListener)
      channelListeners.get(event)?.delete(listener)
      handler((msg as MessageEvent).data.payload)
    }
  }

  broadcastChannel.addEventListener('message', listener as EventListener)

  if (!channelListeners.has(event)) {
    channelListeners.set(event, new Set())
  }
  channelListeners.get(event)!.add(listener)
}
