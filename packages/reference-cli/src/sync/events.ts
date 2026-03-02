import { emit, on } from '../lib/event-bus'
import type { SyncPayload } from './types'

/**
 * Event registry for the sync flow.
 * Maps event names to their payload types for type-safe emit/on usage.
 */
export type SyncEvents = {
  'watch:change': { event: 'add' | 'change' | 'unlink'; path: string }
}

/**
 * Hub for the sync flow – main listener that wires events together.
 * Uses on() handlers that listen and emit() new events with payloads.
 * This is the actual flow of sync, distinct from the EventBus (cross-thread infra).
 */
export function initEvents(payload: SyncPayload): void {
  on('watch:change', (p: unknown) => {
    emit('sync:changed', p as SyncEvents['watch:change'])
  })

  on('sync:complete', () => {
    if (!payload.options.watch) process.exit()
  })
}
