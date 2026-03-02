import { broadcastChannel } from './channel'

export function emit(event: string, payload?: unknown): void {
  broadcastChannel.postMessage({
    type: 'bus:event',
    event,
    payload,
  })
}
