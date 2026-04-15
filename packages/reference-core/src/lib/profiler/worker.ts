import { isMainThread } from 'node:worker_threads'
import { emitLog } from '../log'
import { captureMemorySnapshot, formatProfilerLine } from './memory'
import { isMemoryProfilerEnabled } from './env'

const INTERVAL_MS = 3000

/**
 * Periodic heap snapshot for this worker thread (V8 isolate). Safe to call once
 * at worker startup; no-ops on the main thread or when the profiler flag is off.
 */
export function startWorkerMemoryReporter(workerName: string): void {
  if (!isMemoryProfilerEnabled() || isMainThread) return

  const scope = `worker:${workerName}`
  const tick = (): void => {
    emitLog('info', [formatProfilerLine(captureMemorySnapshot(scope))], {
      module: 'profiler',
    })
  }
  tick()
  setInterval(tick, INTERVAL_MS)
}
