import { emit, on } from '../lib/event-bus'
import type { SyncPayload } from './types'

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

  if (!payload.options.watch) {
    setTimeout(() => emit('sync:changed', { event: 'add', path: '' }), 100)
  }
}
