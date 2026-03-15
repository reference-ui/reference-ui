import { broadcastChannel, channelListeners } from './channel'

let isClosed = false

/**
 * Close the event bus channel and remove tracked listeners.
 * Used during sync shutdown so the CLI can exit without lingering handles.
 */
export function closeEventBus(): void {
  if (isClosed) return

  for (const listeners of channelListeners.values()) {
    for (const listener of listeners) {
      broadcastChannel.removeEventListener('message', listener as EventListener)
    }
  }

  channelListeners.clear()
  broadcastChannel.close()
  isClosed = true
}
