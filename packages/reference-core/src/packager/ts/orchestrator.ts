import { emit, on } from '../../lib/event-bus'

type DtsPhase = 'runtime' | 'final'

/** True once the packager-ts worker has emitted `packager-ts:ready` for the current pool. */
let packagerTsWorkerReady = false

/**
 * Mark the DTS worker as gone (e.g. pool recycled) so we do not dispatch work
 * until a new worker emits `packager-ts:ready`.
 */
export function markPackagerTsWorkerDisposed(): void {
  packagerTsWorkerReady = false
}

/**
 * Coordinate packager-ts request levels on the main thread.
 *
 * Runtime and final declaration requests are part of packager orchestration, not
 * global sync topology. This coordinator keeps that policy near packager-ts
 * startup while still exposing explicit events to the rest of the system.
 */
export function initPackagerTsOrchestrator(): void {
  let runtimeRequestedCount = 0
  let finalRequestedCount = 0
  let runtimeCompletedCount = 0
  let finalCompletedCount = 0
  let running:
    | null
    | {
        phase: DtsPhase
        runtimeTarget: number
        finalTarget: number
      } = null

  const dispatchPendingRun = () => {
    if (!packagerTsWorkerReady || running !== null) return

    if (finalRequestedCount > finalCompletedCount) {
      running = {
        phase: 'final',
        runtimeTarget: runtimeRequestedCount,
        finalTarget: finalRequestedCount,
      }
      emit('run:packager-ts', {
        completionEvent: 'packager-ts:complete',
      })
      return
    }

    if (runtimeRequestedCount > runtimeCompletedCount) {
      running = {
        phase: 'runtime',
        runtimeTarget: runtimeRequestedCount,
        finalTarget: finalCompletedCount,
      }
      emit('run:packager-ts', {
        completionEvent: 'packager-ts:runtime:complete',
      })
    }
  }

  on('packager-ts:ready', () => {
    packagerTsWorkerReady = true
    dispatchPendingRun()
  })

  on('packager-ts:runtime:requested', () => {
    runtimeRequestedCount += 1
    dispatchPendingRun()
  })

  on('packager-ts:final:requested', () => {
    finalRequestedCount += 1
    dispatchPendingRun()
  })

  on('packager-ts:runtime:complete', () => {
    if (running?.phase !== 'runtime') return
    runtimeCompletedCount = Math.max(runtimeCompletedCount, running.runtimeTarget)
    running = null
    dispatchPendingRun()
  })

  on('packager-ts:complete', () => {
    if (running?.phase !== 'final') return
    runtimeCompletedCount = Math.max(runtimeCompletedCount, running.runtimeTarget)
    finalCompletedCount = Math.max(finalCompletedCount, running.finalTarget)
    running = null
    dispatchPendingRun()
  })
}
