import { broadcastChannel, channelListeners } from './channel'
import { parseBusMessage } from './wire'

export function dispatchChannelMessage(message: Event): void {
  const parsed = parseBusMessage((message as MessageEvent).data)
  if (!parsed) return

  const listeners = channelListeners.get(parsed.event)
  if (!listeners?.size) return

  for (const listener of [...listeners]) {
    listener(message)
  }
}

broadcastChannel.addEventListener('message', dispatchChannelMessage as EventListener)
