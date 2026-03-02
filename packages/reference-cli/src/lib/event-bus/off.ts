import { broadcastChannel, channelListeners } from './channel'

export function off(event: string, handler?: Function): void {
  const listeners = channelListeners.get(event)
  if (!listeners) return

  if (handler) {
    listeners.forEach((listener) => {
      const original =
        (listener as { originalHandler?: Function }).originalHandler
      if (listener === handler || original === handler) {
        broadcastChannel.removeEventListener('message', listener as EventListener)
        listeners.delete(listener)
      }
    })
  } else {
    listeners.forEach((listener) => {
      broadcastChannel.removeEventListener('message', listener as EventListener)
    })
    listeners.clear()
  }
}
