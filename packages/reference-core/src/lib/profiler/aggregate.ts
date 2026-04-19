import { BroadcastChannel, isMainThread, threadId } from 'node:worker_threads'
import pc from 'picocolors'
import { sampleChildRssBytesForThread } from './child-rss'
import { isMemoryProfilerEnabled } from './env'

/** Same name = same underlying channel (Node); all isolates post, main listens. */
const CHANNEL_NAME = 'reference-profiler-isolate-heaps-v1'

type HeapMsg = { tid: number; label: string; heapBytes: number }

let channel: BroadcastChannel | undefined
let mainListenerAttached = false

const byTid = new Map<number, { label: string; heapBytes: number }>()

function ensureChannel(): BroadcastChannel {
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME)
  return channel
}

/**
 * Main thread only: subscribe to heap posts from every isolate so we can build a 100% heap pie.
 */
export function initProfilerHeapAggregateListener(): void {
  if (!isMainThread || mainListenerAttached) return
  const ch = ensureChannel()
  ch.onmessage = (ev: { data: unknown }) => {
    const d = ev.data as HeapMsg | undefined
    if (!d || typeof d.heapBytes !== 'number' || typeof d.tid !== 'number' || !d.label) return
    byTid.set(d.tid, { label: String(d.label), heapBytes: Math.max(0, d.heapBytes) })
  }
  mainListenerAttached = true
}

/**
 * Call from any thread after measuring `memoryUsage().heapUsed` for this isolate.
 * Labels should match profiler rows (e.g. `sync-main`, `panda`).
 */
export function publishProfilerHeapSample(label: string, heapBytes: number): void {
  if (!isMemoryProfilerEnabled()) return
  const ch = ensureChannel()
  ch.postMessage({ tid: threadId, label, heapBytes } satisfies HeapMsg)
}

/** Test hook: replace aggregate contents (main-thread map simulation). */
export function seedProfilerHeapAggregateForTest(
  rows: { tid: number; label: string; heapBytes: number }[],
): void {
  byTid.clear()
  for (const r of rows) {
    byTid.set(r.tid, { label: r.label, heapBytes: r.heapBytes })
  }
}

export type HeapSlice = {
  tid: number
  label: string
  /** Same as `label` unless multiple isolates share a label — then `name (tid N)`. */
  displayLabel: string
  heapBytes: number
  pct: number
  /** Sum of RSS for child PIDs spawned via `spawnMonitoredAsync` from this thread (main only). */
  childRssBytes: number
}

function buildHeapPieRows(total: number): HeapSlice[] {
  const rows: HeapSlice[] = []
  for (const [tid, v] of byTid) {
    rows.push({
      tid,
      label: v.label,
      displayLabel: v.label,
      heapBytes: v.heapBytes,
      pct: (v.heapBytes / total) * 100,
      childRssBytes: 0,
    })
  }
  rows.sort((a, b) => b.heapBytes - a.heapBytes)
  return rows
}

function disambiguateWorkerLabels(rows: HeapSlice[]): void {
  const labelCount = new Map<string, number>()
  for (const r of rows) {
    labelCount.set(r.label, (labelCount.get(r.label) ?? 0) + 1)
  }
  for (const r of rows) {
    if ((labelCount.get(r.label) ?? 0) > 1) {
      r.displayLabel = `${r.label} (tid ${r.tid})`
    }
  }
}

function attachChildRssToSlices(rows: HeapSlice[]): void {
  for (const r of rows) {
    r.childRssBytes = isMainThread ? sampleChildRssBytesForThread(r.tid) : 0
  }
}

/**
 * Latest snapshot: each slice is `heap / sum(heaps)` — **V8 isolate heaps only**, sums to 100%.
 * **Not RSS** (RSS is only on the sync-main `TOTAL_USAGE=` line). Isolates that haven’t posted yet are omitted.
 */
export function getIsolateHeapPieSlices(): HeapSlice[] {
  let total = 0
  for (const v of byTid.values()) total += v.heapBytes
  if (total <= 0) return []

  const rows = buildHeapPieRows(total)
  disambiguateWorkerLabels(rows)
  attachChildRssToSlices(rows)
  return rows
}

function formatHeapMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MiB`
}

/**
 * Multi-line summary: how **V8 heap** is split across isolates (Σ=100%). **Not process RSS** — compare to
 * `TOTAL_USAGE=` on sync-main for RSS.
 */
export function formatHeapPieLogLines(): string[] {
  const slices = getIsolateHeapPieSlices()
  if (slices.length === 0) return []

  const header =
    pc.bold('HEAP_SPLIT') +
    ' — ' +
    pc.dim(
      'V8 isolate heaps only. Each % = this isolate’s heap ÷ ',
    ) +
    pc.green('sum(V8 heaps in this table)') +
    pc.dim(' → adds to 100%. ') +
    pc.yellow('Not RSS') +
    pc.dim(' (process RSS is TOTAL_USAGE on sync-main). ') +
    pc.dim('`chld RSS` = sum of monitored child PIDs (') +
    pc.dim('spawnMonitoredAsync') +
    pc.dim(') attributed to that worker thread.')

  const lines: string[] = [header]
  for (const s of slices) {
    const pctStr = `${s.pct.toFixed(1)}%`.padStart(7)
    const childPart =
      s.childRssBytes > 0 ? pc.magenta(`  chld RSS ${formatHeapMb(s.childRssBytes)}`) : ''
    lines.push(
      pc.dim('  ') +
        pc.bold(s.displayLabel.padEnd(28)) +
        '  ' +
        pc.green(pctStr) +
        '   ' +
        pc.dim('heap ') +
        formatHeapMb(s.heapBytes) +
        childPart,
    )
  }
  return lines
}
