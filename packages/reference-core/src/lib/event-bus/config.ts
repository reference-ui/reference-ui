import { getConfig } from '../../config/store'

const EVENT_BUS_MESSAGE_LOGGING_ENABLED = false

export function isEventBusMessageLoggingEnabled(): boolean {
  if (!EVENT_BUS_MESSAGE_LOGGING_ENABLED) return false
  return getConfig()?.debug ?? false
}