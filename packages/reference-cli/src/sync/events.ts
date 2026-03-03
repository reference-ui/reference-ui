import { emit, on } from '../lib/event-bus'

/**
 * Event wiring. Only on/emit/onceAll – pass payloads, no side effects.
 */
export function initEvents(): void {
  on('virtual:ready', () => {
    emit('run:virtual:copy')
  })

  on('watch:change', () => {
    emit('run:virtual:copy')
  })

  on('virtual:complete', () => {
    emit('sync:complete')
  })
}
