import { inspect } from 'node:util'
import { broadcastChannel } from './channel'
import { log } from '../../log'
import { getConfig } from '../../../config/store'

let isInitialized = false
const ANSI_ORANGE = '\u001B[38;5;208m'
const ANSI_DIM = '\u001B[2m'
const ANSI_RESET = '\u001B[0m'
const SEPARATOR = `${ANSI_DIM}--------------------${ANSI_RESET}`

function formatBusEvent(event: string): string {
  return `${ANSI_ORANGE}${event}${ANSI_RESET}`
}

function formatBusPayload(payload: unknown): string {
  return inspect(payload, {
    colors: true,
    compact: false,
    breakLength: 80,
    depth: 6,
    sorted: true,
  })
}

function formatBusLog(event: string, payload: unknown): string {
  return [
    formatBusEvent(event),
    'payload:',
    formatBusPayload(payload),
    SEPARATOR,
  ].join('\n')
}

/**
 * Initialize event bus with debug logging if enabled
 */
export function initEventBus() {
  if (!getConfig()?.debug || isInitialized) return

  broadcastChannel.addEventListener('message', (msg: Event) => {
    const data = (msg as MessageEvent).data
    if (data?.type === 'bus:event') {
      log.debug('bus', formatBusLog(`${data.event}`, data.payload))
    }
  })
  isInitialized = true
}
