import { isMainThread, threadId } from 'node:worker_threads'

/** One decimal MB for logs (matches prior thread-pool memory logging). */
export function formatMb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(1)
}

export type MemorySnapshot = {
  /** Logical scope, e.g. `sync-main`, `worker:virtual`, or `packager-ts:dts:runtime:before`. */
  scope: string
  /** `worker_threads` id; 0 on the main thread. */
  threadId: number
  /** True when sampled on the main thread (sync orchestrator). */
  mainThread: boolean
  rssMb: string
  heapUsedMb: string
  heapTotalMb: string
  externalMb: string
  arrayBuffersMb: string
}

export function captureMemorySnapshot(scope: string): MemorySnapshot {
  const m = process.memoryUsage()
  return {
    scope,
    threadId: isMainThread ? 0 : threadId,
    mainThread: isMainThread,
    rssMb: formatMb(m.rss),
    heapUsedMb: formatMb(m.heapUsed),
    heapTotalMb: formatMb(m.heapTotal),
    externalMb: formatMb(m.external),
    arrayBuffersMb: formatMb(m.arrayBuffers ?? 0),
  }
}

const WORKER_FOOTNOTE = 'V8 isolate for this thread — use sync-main line for process RSS'

/**
 * Main thread: includes RSS (node process total) + main isolate heap.
 * Workers: **omit RSS** — in worker threads `memoryUsage().rss` is still essentially
 * the whole process, so repeating it on every line is misleading.
 */
export function formatProfilerLine(s: MemorySnapshot): string {
  const heap = `heap=${s.heapUsedMb}/${s.heapTotalMb}MiB ext=${s.externalMb}MiB ab=${s.arrayBuffersMb}MiB`
  if (s.mainThread) {
    return `[profiler] ${s.scope} tid=${s.threadId} rss=${s.rssMb}MiB (node process) ${heap}`
  }
  return `[profiler] ${s.scope} tid=${s.threadId} ${heap} (${WORKER_FOOTNOTE})`
}

/** @deprecated Use {@link formatProfilerLine} — kept for tests expecting the old name. */
export function formatSnapshotLine(s: MemorySnapshot): string {
  return formatProfilerLine(s)
}
