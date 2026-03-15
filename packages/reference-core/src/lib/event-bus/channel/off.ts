import { channelListeners } from './channel'
import type { ChannelListener } from './channel'
import type { Events } from '../../../events'

type EventHandler = (payload: unknown) => void | Promise<void>

/**
 * Remove event listener
 */
export function off<K extends keyof Events>(event: K, handler?: EventHandler | ChannelListener): void
export function off(event: string, handler?: EventHandler | ChannelListener): void
export function off(event: string, handler?: EventHandler | ChannelListener) {
  const listeners = channelListeners.get(event)
  if (!listeners) return

  if (handler) {
    listeners.forEach(listener => {
      const match =
        listener === handler ||
        (listener as { originalHandler?: EventHandler | ChannelListener }).originalHandler === handler
      if (match) {
        listeners.delete(listener)
      }
    })
  } else {
    listeners.clear()
  }
}
