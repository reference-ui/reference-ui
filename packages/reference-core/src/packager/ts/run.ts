import { emit } from '../../lib/event-bus'
import { log } from '../../lib/log'
import { installPackagesTs } from './install'
import type { TsPackagerWorkerPayload } from './types'

type DtsCompletionEvent =
  | 'packager-ts:runtime:complete'
  | 'packager-ts:complete'

const FINAL_DTS_COMPLETE_EVENT: DtsCompletionEvent = 'packager-ts:complete'
const RUNTIME_DTS_COMPLETE_EVENT: DtsCompletionEvent = 'packager-ts:runtime:complete'

function mergeCompletionEvent(
  current: DtsCompletionEvent,
  next: DtsCompletionEvent
): DtsCompletionEvent {
  return current === FINAL_DTS_COMPLETE_EVENT || next === FINAL_DTS_COMPLETE_EVENT
    ? FINAL_DTS_COMPLETE_EVENT
    : RUNTIME_DTS_COMPLETE_EVENT
}

interface DtsGenerationRuntimeOptions {
  bundlesReady: boolean
  runGeneration?: (
    payload: TsPackagerWorkerPayload,
    completionEvent?: DtsCompletionEvent
  ) => Promise<void>
}

/** Generate .d.ts and write to outDir. Emits packager-ts:complete when done. */
export async function runDtsGeneration(
  payload: TsPackagerWorkerPayload,
  completionEvent: DtsCompletionEvent = FINAL_DTS_COMPLETE_EVENT
): Promise<void> {
  const { cwd, packages } = payload

  log.debug('packager:ts', 'Generating TypeScript declarations...')

  try {
    await installPackagesTs(cwd, packages)
    emit(completionEvent, {})
    log.debug('packager:ts', 'Declarations ready')
  } catch (error) {
    log.error('[packager:ts] Failed', error)
    throw error
  }
}

/**
 * Create the packager-ts runtime callbacks.
 * Keeps declaration generation single-flight and coalesces overlapping reruns.
 */
export function createDtsGenerationRuntime(
  payload: TsPackagerWorkerPayload,
  options: DtsGenerationRuntimeOptions
): {
  onPackagerRuntimeComplete: () => void
  onPackagerComplete: () => void
  runCatchUpIfNeeded: () => Promise<void>
} {
  const { bundlesReady, runGeneration = runDtsGeneration } = options
  let currentRun: Promise<void> | null = null
  let rerunRequested = false
  let queuedCompletionEvent: DtsCompletionEvent | null = null

  const runSerial = async (
    completionEvent: DtsCompletionEvent
  ): Promise<void> => {
    if (currentRun) {
      rerunRequested = true
      queuedCompletionEvent = queuedCompletionEvent === null
        ? completionEvent
        : mergeCompletionEvent(queuedCompletionEvent, completionEvent)
      return currentRun
    }

    currentRun = (async () => {
      let nextCompletionEvent = completionEvent

      do {
        rerunRequested = false
        queuedCompletionEvent = null
        await runGeneration(payload, nextCompletionEvent).catch(() => {})
        nextCompletionEvent = queuedCompletionEvent ?? nextCompletionEvent
      } while (rerunRequested)
    })().finally(() => {
      currentRun = null
    })

    return currentRun
  }

  return {
    onPackagerRuntimeComplete: () => {
      void runSerial(RUNTIME_DTS_COMPLETE_EVENT)
    },
    onPackagerComplete: () => {
      void runSerial(FINAL_DTS_COMPLETE_EVENT)
    },
    runCatchUpIfNeeded: async () => {
      // A long-lived worker can subscribe after the runtime bundle phase already
      // completed. Catch up from runtime outputs so one-shot sync cannot deadlock
      // waiting on a missed `packager:runtime:complete`.
      if (bundlesReady) {
        await runSerial(RUNTIME_DTS_COMPLETE_EVENT)
      }
    },
  }
}
