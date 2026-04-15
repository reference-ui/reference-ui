import { emit } from '../../lib/event-bus'
import { log } from '../../lib/log'
import { logProfilerSample } from '../../lib/profiler'
import { installPackagesTs } from './install'
import type { TsPackagerCompletionEvent, TsPackagerWorkerPayload } from './types'

function dtsPhaseLabel(completionEvent: TsPackagerCompletionEvent): 'runtime' | 'final' {
  return completionEvent === 'packager-ts:runtime:complete' ? 'runtime' : 'final'
}

const FINAL_DTS_COMPLETE_EVENT: TsPackagerCompletionEvent = 'packager-ts:complete'

function getPackagesForRun(
  payload: TsPackagerWorkerPayload,
  completionEvent: TsPackagerCompletionEvent
): TsPackagerWorkerPayload['packages'] {
  if (completionEvent === 'packager-ts:runtime:complete') {
    return payload.packages.filter(
      pkg => pkg.name === '@reference-ui/react' || pkg.name === '@reference-ui/system'
    )
  }

  return payload.packages.filter(pkg => pkg.name === '@reference-ui/types')
}

interface DtsGenerationQueueOptions {
  runGeneration?: (
    payload: TsPackagerWorkerPayload,
    completionEvent?: TsPackagerCompletionEvent
  ) => Promise<void>
}

/** Generate .d.ts and emit the requested completion event when done. */
export async function runDtsGeneration(
  payload: TsPackagerWorkerPayload,
  completionEvent: TsPackagerCompletionEvent = FINAL_DTS_COMPLETE_EVENT
): Promise<void> {
  const { cwd } = payload
  const packages = getPackagesForRun(payload, completionEvent)
  const phase = dtsPhaseLabel(completionEvent)

  log.debug('packager:ts', 'Generating TypeScript declarations...')

  try {
    logProfilerSample(`packager-ts:dts:${phase}:before`)
    await installPackagesTs(cwd, packages)
    logProfilerSample(`packager-ts:dts:${phase}:after`)
    emit(completionEvent, {})
    log.debug('packager:ts', 'Declarations ready')
  } catch (error) {
    log.error('[packager:ts] Failed', error)
    throw error
  }
}

/**
 * Create a single-flight queue for declaration generation requests.
 * Global orchestration decides which completion event should run next; this
 * queue only ensures requests execute one at a time inside the worker.
 */
export function createDtsGenerationQueue(
  payload: TsPackagerWorkerPayload,
  options: DtsGenerationQueueOptions = {}
): {
  run: (completionEvent: TsPackagerCompletionEvent) => Promise<void>
} {
  const { runGeneration = runDtsGeneration } = options
  let currentRun: Promise<void> = Promise.resolve()

  const run = async (completionEvent: TsPackagerCompletionEvent): Promise<void> => {
    currentRun = currentRun
      .catch(() => {})
      .then(() => runGeneration(payload, completionEvent))
      .catch(() => {})
    return currentRun
  }

  return {
    run,
  }
}
