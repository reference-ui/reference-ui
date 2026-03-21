import { emit, on, onceAll } from '../lib/event-bus'
import { combineTrigger, emitOnAny, forWorker, onReady } from './events.utils'

/**
 * Event wiring. Only on/emit/onceAll – pass payloads, no side effects.
 * watch:change → run:virtual:sync:file (single file), passing payload through.
 */
export function initEvents(): void {
  onceAll(['virtual:ready', 'reference:ready'], () => {
    emit('run:virtual:copy:all')
  })

  on('virtual:copy:complete', ({ virtualDir }) => {
    emit('run:reference:copy-browser', { virtualDir })
  })

  on('reference:browser:virtual-ready', () => {
    emit('virtual:complete', {})
  })

  on('watch:change', (payload) => {
    emit('run:virtual:sync:file', payload)
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

  onceAll(['system:config:complete', 'system:panda:ready'], () => {
    emit('run:panda:codegen')
  })

  emitOnAny({
    on: [
      'system:config:failed',
      'system:panda:codegen:failed',
      'virtual:failed',
      'reference:failed',
      'reference:browser:virtual-failed',
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
