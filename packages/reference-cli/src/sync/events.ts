import { emit, on } from '../lib/event-bus'
import type { SyncOptions } from './types'

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
export function initEvents(options?: SyncOptions): void {
  on('watch:change', (payload: unknown) => {
    const p = payload as SyncEvents['watch:change']
    emit('sync:changed', p)
  })

  on('sync:complete', () => {
    if (!options?.watch) process.exit()
  })
}
