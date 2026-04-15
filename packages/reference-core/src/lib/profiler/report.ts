import { isMainThread } from 'node:worker_threads'
import { publishProfilerHeapSample } from './aggregate'
import { emitLog, log } from '../log'
import { captureMemorySnapshot, formatProfilerLine, profilerScopeColorKey } from './memory'
import { isMemoryProfilerEnabled } from './env'

/**
 * One-off sample (e.g. pipeline phase). Works on main or worker threads.
 * Use narrow `scope` strings so logs attribute heap to a specific step.
 */
export function logProfilerSample(scope: string): void {
  if (!isMemoryProfilerEnabled()) return
  const snap = captureMemorySnapshot(scope)
  const label = profilerScopeColorKey(scope)
  publishProfilerHeapSample(label, snap.heapUsedBytes ?? 0)
  const line = formatProfilerLine(snap, { compactWorkerLines: !isMainThread })
  if (isMainThread) {
    log.info('[profiler] ' + line)
  } else {
    emitLog('info', [line], { module: 'profiler' })
  }
}
