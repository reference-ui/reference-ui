import { channelListeners } from './channel'
import './dispatch'
import { parseBusMessage } from './wire'
import type { Events } from '../../../events'

type EventHandler = (payload: unknown) => void | Promise<void>
type WrappedListener = ((msg: Event) => void) & {
  originalHandler?: EventHandler
}

function trackListener(event: string, listener: WrappedListener): void {
  if (!channelListeners.has(event)) {
    channelListeners.set(event, new Set())
  }
  channelListeners.get(event)!.add(listener)
}

/**
 * Typed on - listens on BroadcastChannel (works in any thread)
 */
export function on<K extends keyof Events>(
  event: K,
  handler: (payload: Events[K]) => void | Promise<void>
): void
export function on(event: string, handler: (payload: unknown) => void | Promise<void>): void
export function on(event: string, handler: (payload: unknown) => void | Promise<void>) {
  const listener: WrappedListener = (msg: Event) => {
    const parsed = parseBusMessage((msg as MessageEvent).data)
    if (parsed?.event === event) {
      handler(parsed.payload)
    }
  }
  listener.originalHandler = handler

  trackListener(event, listener)
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
  const listener: WrappedListener = (msg: Event) => {
    const parsed = parseBusMessage((msg as MessageEvent).data)
    if (parsed?.event === event) {
      channelListeners.get(event)?.delete(listener)
      handler(parsed.payload)
    }
  }
  listener.originalHandler = handler

  trackListener(event, listener)
}
