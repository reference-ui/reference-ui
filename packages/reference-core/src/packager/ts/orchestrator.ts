import { emit, on } from '../../lib/event-bus'
import type { TsPackagerCompletionEvent } from './types'

interface OrchestratorState {
  running: boolean
  pendingCompletionEvent?: TsPackagerCompletionEvent
}

const state: OrchestratorState = {
  running: false,
}

function queueCompletionEvent(completionEvent: TsPackagerCompletionEvent): void {
  if (state.pendingCompletionEvent === 'packager-ts:complete') {
    return
  }

  if (completionEvent === 'packager-ts:complete') {
    state.pendingCompletionEvent = completionEvent
    flushQueue()
    return
  }

  if (!state.pendingCompletionEvent) {
    state.pendingCompletionEvent = completionEvent
  }

  flushQueue()
}

function flushQueue(): void {
  if (state.running || !state.pendingCompletionEvent) {
    return
  }

  const completionEvent = state.pendingCompletionEvent
  state.pendingCompletionEvent = undefined
  state.running = true
  emit('run:packager-ts', { completionEvent })
}

function markIdle(): void {
  state.running = false
  flushQueue()
}

export function resetTsPackagerOrchestrator(): void {
  state.running = false
  state.pendingCompletionEvent = undefined
}

export function initTsPackagerOrchestrator(): void {
  resetTsPackagerOrchestrator()

  on('packager-ts:runtime:requested', () => {
    queueCompletionEvent('packager-ts:runtime:complete')
  })
  on('packager-ts:final:requested', () => {
    queueCompletionEvent('packager-ts:complete')
  })
  on('packager-ts:runtime:complete', () => {
    markIdle()
  })
  on('packager-ts:complete', () => {
    markIdle()
  })
  on('packager-ts:failed', () => {
    markIdle()
  })
}
