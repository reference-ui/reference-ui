import {
  broadcastChannel,
  BUS_CHANNEL_NAME,
  BUS_EVENT_ENVELOPE_TYPE,
  closeEventBus,
  createBusEnvelope,
  emit,
  initEventBus,
  off,
  on,
  once,
  onceAll,
  openBusChannel,
  parseBusMessage,
} from './channel'
import type { Events } from '../../events'

export {
  broadcastChannel,
  BUS_CHANNEL_NAME,
  BUS_EVENT_ENVELOPE_TYPE,
  closeEventBus,
  createBusEnvelope,
  emit,
  initEventBus,
  off,
  on,
  once,
  onceAll,
  openBusChannel,
  parseBusMessage,
}
export type { BusEnvelope } from './channel'
export type { Events }
