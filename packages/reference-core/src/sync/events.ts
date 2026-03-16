import { emit, on, onceAll } from '../lib/event-bus'
import { forWorker } from './events.utils'

const SYNC_FAILED_EVENT = 'sync:failed'

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

  on('system:config:failed', () => {
    emit(SYNC_FAILED_EVENT)
  })

  on('system:panda:codegen:failed', () => {
    emit(SYNC_FAILED_EVENT)
  })

  on('virtual:failed', () => {
    emit(SYNC_FAILED_EVENT)
  })

  on('reference:failed', () => {
    emit(SYNC_FAILED_EVENT)
  })

  forWorker({
    ready: 'packager:ready',
    on: 'system:panda:codegen',
    emit: 'run:packager:bundle',
  })

  /** Sync completes after packager-ts:complete. Packager emits packager-ts:complete when skipTypescript so this always fires. */
  on('packager-ts:complete', () => {
    emit('sync:complete')
  })
}
