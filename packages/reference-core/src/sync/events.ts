import { emit, on, onceAll } from '../lib/event-bus'

const SYNC_FAILED_EVENT = 'sync:failed'

/**
 * Event wiring. Only on/emit/onceAll – pass payloads, no side effects.
 * watch:change → run:virtual:sync:file (single file), passing payload through.
 */
export function initEvents(): void {
  let packagerReady = false
  let pendingPackagerBundle = false

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

  on('system:config:failed', () => {
    emit(SYNC_FAILED_EVENT)
  })

  on('system:panda:codegen:failed', () => {
    emit(SYNC_FAILED_EVENT)
  })

  on('virtual:failed', () => {
    emit(SYNC_FAILED_EVENT)
  })

  on('packager:ready', () => {
    packagerReady = true
    if (pendingPackagerBundle) {
      pendingPackagerBundle = false
      emit('run:packager:bundle')
    }
  })

  on('system:panda:codegen', () => {
    if (packagerReady) {
      emit('run:packager:bundle')
    } else {
      pendingPackagerBundle = true
    }
  })

  /** Sync completes after packager-ts:complete. Packager emits packager-ts:complete when skipTypescript so this always fires. */
  on('packager-ts:complete', () => {
    emit('sync:complete')
  })
}
