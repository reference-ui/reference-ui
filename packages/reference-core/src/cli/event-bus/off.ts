import { broadcastChannel, channelListeners } from './channel'
import type { Events } from './events'

/**
 * Remove event listener
 */
export function off<K extends keyof Events>(event: K, handler?: Function): void
export function off(event: string, handler?: Function): void
export function off(event: string, handler?: Function) {
  const listeners = channelListeners.get(event)
  if (!listeners) return

  if (handler) {
    listeners.forEach(listener => {
      if (listener === handler || (listener as { originalHandler?: Function }).originalHandler === handler) {
        broadcastChannel.removeEventListener('message', listener as EventListener)
        listeners.delete(listener)
      }
    })
  } else {
    listeners.forEach(listener => {
      broadcastChannel.removeEventListener('message', listener as EventListener)
    })
    listeners.clear()
  }
}
