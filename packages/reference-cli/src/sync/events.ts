import { emit, on } from '../lib/event-bus'

/**
 * Event wiring. Only on/emit/onceAll – pass payloads, no side effects.
 * Virtual worker listens to watch:change directly for incremental copy per file.
 */
export function initEvents(): void {
  on('virtual:ready', () => {
    emit('run:virtual:copy:all')
  })

  on('virtual:complete', () => {
    emit('sync:complete')
  })
}
