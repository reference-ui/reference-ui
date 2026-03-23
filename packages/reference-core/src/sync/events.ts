import { emit, on, onceAll } from '../lib/event-bus'
import { afterFirst, combineTrigger, emitOnAny, forWorker, onReady } from './events.utils'

const VIRTUAL_COMPLETE_EVENT = 'virtual:complete' as const
const RUN_REFERENCE_BUILD_EVENT = 'run:reference:build' as const

/**
 * Event wiring. Only on/emit/onceAll – pass payloads, no side effects.
 * watch:change → run:virtual:sync:file (single file), passing payload through.
 */
export function initEvents(): void {
  onceAll(['virtual:ready', 'reference:ready'], () => {
    emit('run:virtual:copy:all')
  })

  on('virtual:copy:complete', ({ virtualDir }) => {
    emit('run:reference:component:copy', { virtualDir })
  })

  on('reference:component:copied', () => {
    emit(VIRTUAL_COMPLETE_EVENT, {})
  })

  on('watch:change', (payload) => {
    emit('run:virtual:sync:file', payload)
  })

  afterFirst(VIRTUAL_COMPLETE_EVENT, {
    on: 'virtual:fs:change',
    emit: 'run:system:config',
  })

  afterFirst(VIRTUAL_COMPLETE_EVENT, {
    on: 'virtual:fs:change',
    emit: RUN_REFERENCE_BUILD_EVENT,
    payload: {},
  })

  forWorker({
    ready: 'system:config:ready',
    on: VIRTUAL_COMPLETE_EVENT,
    emit: 'run:system:config',
  })

  forWorker({
    ready: 'system:panda:ready',
    on: 'system:config:complete',
    emit: 'run:panda:codegen',
  })

  onReady('packager:ready', combineTrigger({
    requires: ['system:panda:codegen'],
    emit: 'run:packager:runtime:bundle',
  }))

  onReady('reference:ready', combineTrigger({
    requires: [VIRTUAL_COMPLETE_EVENT, 'packager-ts:runtime:complete'],
    emit: RUN_REFERENCE_BUILD_EVENT,
    payload: {},
  }))

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
    requires: ['reference:complete'],
    emit: 'run:packager:bundle',
  }))

  /** Sync completes after packager-ts:complete. Packager emits packager-ts:complete when skipTypescript so this always fires. */
  on('packager-ts:complete', () => {
    emit('sync:complete')
  })
}
