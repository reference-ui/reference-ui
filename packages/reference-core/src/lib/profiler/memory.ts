import { isMainThread, threadId } from 'node:worker_threads'
import pc from 'picocolors'

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
  /** Raw `memoryUsage().rss` — used for accurate `OF_RSS` % (avoid MiB rounding drift). */
  rssBytes?: number
  /** Raw `memoryUsage().heapUsed` — this isolate; used with `rssBytes` for `OF_RSS`. */
  heapUsedBytes?: number
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
    rssBytes: m.rss,
    heapUsedBytes: m.heapUsed,
    rssMb: formatMb(m.rss),
    heapUsedMb: formatMb(m.heapUsed),
    heapTotalMb: formatMb(m.heapTotal),
    externalMb: formatMb(m.external),
    arrayBuffersMb: formatMb(m.arrayBuffers ?? 0),
  }
}

/**
 * Key used for display: `worker:panda` → `panda`; `packager-ts:foo` → `packager-ts`.
 * Exported for tests.
 */
export function profilerScopeColorKey(scope: string): string {
  if (scope.startsWith('worker:')) return scope.slice('worker:'.length)
  const head = scope.split(':')[0]
  return head && head.length > 0 ? head : scope
}

/** Sync orchestrator row (`mainThread`): brighter blue. */
function paintMainModuleName(display: string): string {
  return pc.bold(pc.blueBright(display))
}

/** Worker / per-package rows: darker blue. */
function paintWorkerModuleName(display: string): string {
  return pc.bold(pc.blue(display))
}

/** Process RSS (`memoryUsage().rss`) — only on the main-thread row; one place for the full total. */
function paintMainTotalUsageMiB(mb: string): string {
  if (!pc.isColorSupported) return `${mb}MiB`
  return `\x1b[1m\x1b[38;5;172m${mb}MiB\x1b[0m`
}

/** This thread’s V8 heap (isolate) — lighter yellow; contrasts with process total on sync-main. */
function paintWorkerIsolateHeapMiB(mb: string): string {
  return pc.bold(pc.yellowBright(`${mb}MiB`))
}

function formatMetricsPlain(s: MemorySnapshot): string {
  return `HEAP=${s.heapUsedMb}/${s.heapTotalMb}MiB EXT=${s.externalMb}MiB AB=${s.arrayBuffersMb}MiB`
}

function getHeapAndRssBytes(s: MemorySnapshot): { heap: number; rss: number } | null {
  if (typeof s.rssBytes === 'number' && typeof s.heapUsedBytes === 'number') {
    const rss = s.rssBytes
    const heap = s.heapUsedBytes
    if (!Number.isFinite(rss) || rss <= 0 || !Number.isFinite(heap) || heap < 0) return null
    return { heap, rss }
  }
  const rss = Number.parseFloat(s.rssMb) * 1024 * 1024
  const heap = Number.parseFloat(s.heapUsedMb) * 1024 * 1024
  if (!Number.isFinite(rss) || rss <= 0 || !Number.isFinite(heap) || heap < 0) return null
  return { heap, rss }
}

/**
 * This isolate’s heap as % of **process** RSS (`heapUsed / rss`). Uses byte values when present so
 * the figure matches “~X% of resident set” without MiB rounding error. Not a partition of RSS across
 * rows (non-heap memory and other isolates are not split).
 *
 * Exported for tests.
 */
export function formatHeapVsRssPercent(s: MemorySnapshot): string | null {
  const pair = getHeapAndRssBytes(s)
  if (!pair) return null
  const pct = (pair.heap / pair.rss) * 100
  if (!Number.isFinite(pct) || pct < 0) return null
  const capped = Math.min(100, pct)
  if (capped >= 10) return capped.toFixed(1)
  return capped.toFixed(2)
}

/** Highlight `OF_RSS≈…%` so it’s distinct from heap MiB and TOTAL_USAGE. */
function paintHeapVsRssLabel(pct: string): string {
  return pc.cyan(`OF_RSS≈${pct}%`)
}

function formatColoredHeapVsRssSuffix(s: MemorySnapshot): string {
  const pct = formatHeapVsRssPercent(s)
  if (pct === null) return ''
  return ` ${paintHeapVsRssLabel(pct)}`
}

function formatProcessTotalSegment(s: MemorySnapshot): string {
  return `TOTAL_USAGE=${paintMainTotalUsageMiB(s.rssMb)}`
}

/** Worker isolate heap (yellow) + colored OF_RSS. */
function formatWorkerIsolateSegment(s: MemorySnapshot): string {
  const heap = paintWorkerIsolateHeapMiB(s.heapUsedMb)
  return `ISOLATE_HEAP=${heap}${formatColoredHeapVsRssSuffix(s)}`
}

export type ProfilerFormatOptions = {
  /**
   * Omit `ISOLATE_HEAP` / `OF_RSS` on workers — periodic `HEAP_SPLIT` on main shows heap shares.
   * Still logs `HEAP` / `EXT` / `AB` for this isolate.
   */
  compactWorkerLines?: boolean
}

/**
 * **Module name:** bright blue on sync main, dark blue on workers.
 * **Main:** `TOTAL_USAGE` (dark orange) + cyan `OF_RSS` (this isolate’s heap vs process RSS).
 * **Workers:** full: `ISOLATE_HEAP` + `OF_RSS`; compact: metrics only (see `compactWorkerLines`).
 */
export function formatProfilerLine(s: MemorySnapshot, options?: ProfilerFormatOptions): string {
  if (s.mainThread) {
    const name = paintMainModuleName(s.scope)
    return `${name} ${formatProcessTotalSegment(s)}${formatColoredHeapVsRssSuffix(s)} ${formatMetricsPlain(s)}`
  }

  const key = profilerScopeColorKey(s.scope)
  const display = s.scope.startsWith('worker:') ? key : s.scope
  const name = paintWorkerModuleName(display)
  if (options?.compactWorkerLines) {
    return `${name} tid=${s.threadId} ${formatMetricsPlain(s)}`
  }
  const isolate = formatWorkerIsolateSegment(s)
  return `${name} tid=${s.threadId} ${isolate} ${formatMetricsPlain(s)}`
}

/** @deprecated Use {@link formatProfilerLine} — kept for tests expecting the old name. */
export function formatSnapshotLine(s: MemorySnapshot, options?: ProfilerFormatOptions): string {
  return formatProfilerLine(s, options)
}
