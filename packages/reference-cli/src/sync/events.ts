import { emit, on, onceAll } from '../lib/event-bus'

/**
 * Event wiring. Only on/emit/onceAll – pass payloads, no side effects.
 * watch:change → run:virtual:sync:file (single file), passing payload through.
 */
export function initEvents(): void {
  on('virtual:ready', () => {
    emit('run:virtual:copy:all')
  })

  on('watch:change', (payload) => {
    emit('run:virtual:sync:file', payload)
  })

  on('virtual:complete', () => {
    emit('run:system:config')
  })

  onceAll(['system:config:complete', 'system:panda:ready'], () => {
    emit('run:panda:codegen')
  })

  on('system:panda:codegen', () => {
    emit('run:packager:bundle')
  })

  on('packager:complete', () => {
    emit('sync:complete')
  })
}
