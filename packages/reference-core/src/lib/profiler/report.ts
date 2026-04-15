import { isMainThread } from 'node:worker_threads'
import { emitLog, log } from '../log'
import { captureMemorySnapshot, formatProfilerLine } from './memory'
import { isMemoryProfilerEnabled } from './env'

/**
 * One-off sample (e.g. pipeline phase). Works on main or worker threads.
 * Use narrow `scope` strings so logs attribute heap to a specific step.
 */
export function logProfilerSample(scope: string): void {
  if (!isMemoryProfilerEnabled()) return
  const line = formatProfilerLine(captureMemorySnapshot(scope))
  if (isMainThread) {
    log.info(line)
  } else {
    emitLog('info', [line], { module: 'profiler' })
  }
}
