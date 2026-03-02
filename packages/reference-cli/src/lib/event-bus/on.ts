import { broadcastChannel, channelListeners } from './channel'

export function on(
  event: string,
  handler: (payload: unknown) => void | Promise<void>
): void {
  const listener = (msg: Event) => {
    const data = (msg as MessageEvent).data
    if (data?.type === 'bus:event' && data.event === event) {
      handler(data.payload)
    }
  }

  broadcastChannel.addEventListener('message', listener as EventListener)

  if (!channelListeners.has(event)) {
    channelListeners.set(event, new Set())
  }
  channelListeners.get(event)!.add(listener)
}

export function once(
  event: string,
  handler: (payload: unknown) => void | Promise<void>
): void {
  const listener = (msg: Event) => {
    const data = (msg as MessageEvent).data
    if (data?.type === 'bus:event' && data.event === event) {
      broadcastChannel.removeEventListener('message', listener as EventListener)
      channelListeners.get(event)?.delete(listener)
      handler(data.payload)
    }
  }

  broadcastChannel.addEventListener('message', listener as EventListener)

  if (!channelListeners.has(event)) {
    channelListeners.set(event, new Set())
  }
  channelListeners.get(event)!.add(listener)
}
