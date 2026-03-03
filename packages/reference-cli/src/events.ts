import type { SyncEvents } from './sync/types'
import type { VirtualEvents } from './virtual/events'
import type { WatchEvents } from './watch/events'
import type { SystemEvents } from './system/events'

/**
 * Main event registry – maps event names to payload types.
 * Format: { 'event:name': PayloadType }
 * Imported by lib/event-bus for typed emit/on/once.
 */
export type Events = SyncEvents & VirtualEvents & WatchEvents & SystemEvents
