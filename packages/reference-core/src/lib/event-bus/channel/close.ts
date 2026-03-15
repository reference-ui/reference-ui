import { broadcastChannel, channelListeners } from './channel'
import { dispatchChannelMessage } from './dispatch'

let isClosed = false

/**
 * Close the event bus channel and remove tracked listeners.
 * Used during sync shutdown so the CLI can exit without lingering handles.
 */
export function closeEventBus(): void {
  if (isClosed) return

  channelListeners.clear()
  broadcastChannel.removeEventListener('message', dispatchChannelMessage as EventListener)
  broadcastChannel.close()
  isClosed = true
}
