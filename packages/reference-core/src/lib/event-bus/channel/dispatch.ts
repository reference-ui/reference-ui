import { broadcastChannel, channelListeners } from './channel'

export function dispatchChannelMessage(message: Event): void {
  const data = (message as MessageEvent).data
  if (data?.type !== 'bus:event' || typeof data.event !== 'string') return

  const listeners = channelListeners.get(data.event)
  if (!listeners?.size) return

  for (const listener of [...listeners]) {
    listener(message)
  }
}

broadcastChannel.addEventListener('message', dispatchChannelMessage as EventListener)
