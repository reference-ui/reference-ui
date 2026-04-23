import { broadcastChannel, channelListeners } from './channel'
import { parseBusMessage, type BusEnvelope } from './wire'

/** Dispatches a bus envelope from a `message` event on `node:worker_threads` `BroadcastChannel`. */
export function dispatchChannelMessage(message: Event): void {
  dispatchBusEnvelope((message as MessageEvent).data)
}

export function dispatchBusEnvelope(envelope: unknown): void {
  const parsed = parseBusMessage(envelope)
  if (!parsed) return

  const listeners = channelListeners.get(parsed.event)
  if (!listeners?.size) return

  for (const listener of [...listeners]) {
    listener({
      data: envelope as BusEnvelope,
    } as MessageEvent)
  }
}

broadcastChannel.addEventListener('message', dispatchChannelMessage as EventListener)
