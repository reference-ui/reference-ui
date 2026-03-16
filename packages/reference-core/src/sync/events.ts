import { emit, on, onceAll } from '../lib/event-bus'
import { forWorker } from './events.utils'

const SYNC_FAILED_EVENT = 'sync:failed'

/**
 * Event wiring. Only on/emit/onceAll – pass payloads, no side effects.
 * watch:change → run:virtual:sync:file (single file), passing payload through.
 */
export function initEvents(): void {
  let packagerReady = false
  let pandaCodegenCount = 0
  let referenceCompleteCount = 0
  let lastPackagerPandaCount = 0
  let lastPackagerReferenceCount = 0

  const maybeRunPackager = () => {
    if (!packagerReady) return
    if (pandaCodegenCount <= lastPackagerPandaCount) return
    if (referenceCompleteCount <= lastPackagerReferenceCount) return

    lastPackagerPandaCount = pandaCodegenCount
    lastPackagerReferenceCount = referenceCompleteCount
    emit('run:packager:bundle')
  }

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

  on('packager:ready', () => {
    packagerReady = true
    maybeRunPackager()
  })

  on('system:panda:codegen', () => {
    pandaCodegenCount += 1
    maybeRunPackager()
  })

  on('reference:complete', () => {
    referenceCompleteCount += 1
    maybeRunPackager()
  })

  /** Sync completes after packager-ts:complete. Packager emits packager-ts:complete when skipTypescript so this always fires. */
  on('packager-ts:complete', () => {
    emit('sync:complete')
  })
}
