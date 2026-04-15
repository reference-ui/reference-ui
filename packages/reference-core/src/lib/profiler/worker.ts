import { isMainThread } from 'node:worker_threads'
import { publishProfilerHeapSample } from './aggregate'
import { emitLog } from '../log'
import { captureMemorySnapshot, formatProfilerLine } from './memory'
import { isMemoryProfilerEnabled } from './env'

const INTERVAL_MS = 3000

export type StartWorkerMemoryReporterOptions = {
  /**
   * When true, emit a periodic `[profiler] name tid=… HEAP=…` line. Default false so only targeted
   * workers (e.g. packager-ts) add log noise; all workers still publish heap for `HEAP_SPLIT`.
   */
  logSampleLines?: boolean
}

/**
 * Periodic heap sample for `HEAP_SPLIT` on the main thread. Optionally logs a compact line when
 * `logSampleLines` is true (used for packager-ts zoom-in).
 */
export function startWorkerMemoryReporter(
  workerName: string,
  options?: StartWorkerMemoryReporterOptions,
): void {
  if (!isMemoryProfilerEnabled() || isMainThread) return

  const logSampleLines = options?.logSampleLines ?? false
  const scope = `worker:${workerName}`
  const tick = (): void => {
    const snap = captureMemorySnapshot(scope)
    publishProfilerHeapSample(workerName, snap.heapUsedBytes ?? 0)
    if (logSampleLines) {
      emitLog('info', [formatProfilerLine(snap, { compactWorkerLines: true })], {
        module: 'profiler',
      })
    }
  }
  tick()
  setInterval(tick, INTERVAL_MS)
}
