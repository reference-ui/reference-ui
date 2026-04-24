import { emit, on } from '../../lib/event-bus'
import { startWorkerMemoryReporter } from '../../lib/profiler'
import { KEEP_ALIVE } from '../../lib/thread-pool'
import { onRunPackagerTs } from './run'
import type { TsPackagerWorkerPayload } from './types'

export default async function runPackagerTsWorker(
  payload: TsPackagerWorkerPayload
): Promise<never> {
  startWorkerMemoryReporter('packager-ts')
  on('run:packager-ts', ({ completionEvent }) => {
    onRunPackagerTs({
      cwd: payload.cwd,
      completionEvent,
    })
  })
  emit('packager-ts:ready', {})

  return KEEP_ALIVE
}
