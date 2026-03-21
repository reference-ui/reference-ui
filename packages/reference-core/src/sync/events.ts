import { emit, on, onceAll } from '../lib/event-bus'
import { combineTrigger, emitOnAny, forWorker, onReady } from './events.utils'

/**
 * Event wiring. Only on/emit/onceAll – pass payloads, no side effects.
 * watch:change → run:virtual:sync:file (single file), passing payload through.
 */
export function initEvents(): void {
  let watchUpdatesEnabled = false

  onceAll(['virtual:ready', 'reference:ready'], () => {
    emit('run:virtual:copy:all')
  })

  on('virtual:copy:complete', ({ virtualDir }) => {
    emit('run:reference:component:copy', { virtualDir })
  })

  on('reference:component:copied', () => {
    emit('virtual:complete', {})
  })

  on('virtual:complete', () => {
    watchUpdatesEnabled = true
  })

  on('watch:change', (payload) => {
    emit('run:virtual:sync:file', payload)
  })

  on('virtual:fs:change', () => {
    if (!watchUpdatesEnabled) return
    emit('run:system:config')
    emit('run:reference:build', {})
  })

  forWorker({
    ready: 'system:config:ready',
    on: 'virtual:complete',
    emit: 'run:system:config',
  })

  forWorker({
    ready: 'reference:ready',
    on: 'virtual:complete',
    emit: 'run:reference:build',
    payload: {},
  })

  forWorker({
    ready: 'system:panda:ready',
    on: 'system:config:complete',
    emit: 'run:panda:codegen',
  })

  emitOnAny({
    on: [
      'system:config:failed',
      'system:panda:codegen:failed',
      'virtual:failed',
      'reference:failed',
      'reference:component:copy-failed',
    ],
    emit: 'sync:failed',
  })

  onReady('packager:ready', combineTrigger({
    requires: ['system:panda:codegen', 'reference:complete'],
    emit: 'run:packager:bundle',
  }))

  /** Sync completes after packager-ts:complete. Packager emits packager-ts:complete when skipTypescript so this always fires. */
  on('packager-ts:complete', () => {
    emit('sync:complete')
  })
}
