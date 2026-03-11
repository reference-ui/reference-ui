import { broadcastChannel } from './channel'
import { config } from '../config'
import { log } from '../../log'

let isInitialized = false

/**
 * Initialize event bus with debug logging if enabled
 */
export function initEventBus() {
  if (!config.debug || isInitialized) return

  broadcastChannel.addEventListener('message', (msg: Event) => {
    const data = (msg as MessageEvent).data
    if (data?.type === 'bus:event') {
      log.debug('bus', `${data.event}`, data.payload)
    }
  })
  isInitialized = true
}
