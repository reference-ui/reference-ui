import { BroadcastChannel } from 'node:worker_threads'

/**
 * Shared BroadcastChannel name and envelope for the Reference UI bus.
 * Use `createBusEnvelope` / `parseBusMessage` / `openBusChannel` so ad-hoc
 * listeners (e.g. log relay) match `emit` without copying object shapes by hand.
 */
export const BUS_CHANNEL_NAME = 'reference-ui:events' as const

export const BUS_EVENT_ENVELOPE_TYPE = 'bus:event' as const

export type BusEnvelope = {
  type: typeof BUS_EVENT_ENVELOPE_TYPE
  event: string
  payload: unknown
}

/** Same object shape as `emit()` posts to the channel. */
export function createBusEnvelope(event: string, payload?: unknown): BusEnvelope {
  return {
    type: BUS_EVENT_ENVELOPE_TYPE,
    event,
    payload: payload ?? {},
  }
}

/**
 * Structural check: if `data` matches the bus envelope, return `{ event, payload }`;
 * otherwise `undefined`. Deterministic — no exceptions.
 */
export function parseBusMessage(data: unknown): { event: string; payload: unknown } | undefined {
  if (!data || typeof data !== 'object') return undefined
  const d = data as Record<string, unknown>
  if (d.type !== BUS_EVENT_ENVELOPE_TYPE || typeof d.event !== 'string') return undefined
  return { event: d.event, payload: d.payload }
}

/** Named channel for any thread that needs its own handle (e.g. log relay close vs `closeEventBus`). */
export function openBusChannel(): BroadcastChannel {
  return new BroadcastChannel(BUS_CHANNEL_NAME)
}
