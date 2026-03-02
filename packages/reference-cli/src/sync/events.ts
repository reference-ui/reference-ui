import { emit, on } from '../lib/event-bus'
import type { SyncPayload } from './types'

export type { SyncEvents } from './event-types'

/**
 * Hub for the sync flow – wires events together.
 */
export function initEvents(payload: SyncPayload): void {
  on('watch:change', (p) => {
    emit('sync:changed', p)
  })

  on('sync:complete', () => {
    if (!payload.options.watch) process.exit()
  })
}
