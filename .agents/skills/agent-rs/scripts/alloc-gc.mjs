/**
 * `--trace-gc` parser for `pnpm agentrs alloc`.
 *
 * It takes the raw stdout of a worker run under `node --trace-gc` (V8 prints
 * GC lines to stdout, interleaved with the sample JSON) and emits
 * the classified GC census: scavenge vs mark-sweep/mark-compact counts, exact
 * per-kind tallies, and the V8 heap high-water marks. The R1 post-mortem turns
 * on whole-run counts (12sc/0mc at enterprise), so the parser keeps every
 * event with its timestamp rather than windowing around an unmarked sync.
 */

const GC_LINE = /^\[(\d+):0x[0-9a-f]+\]\s+([\d.]+) ms: ([A-Za-z-]+)(?:\s+\([^)]*\))?\s+([\d.]+) \(([\d.]+)\) -> ([\d.]+) \(([\d.]+)\) MB,(.*)$/

function classifyKind(kind) {
  if (kind.startsWith('Scavenge')) return 'scavenge'
  if (kind.includes('Mark')) return 'full'
  return 'other'
}

function parseGcLine(line) {
  const match = GC_LINE.exec(line.trim())
  if (!match) return null
  const [, , tMs, kind, beforeMb, , afterMb, , tail] = match
  return {
    tMs: Number(tMs),
    kind,
    heapBeforeMb: Number(beforeMb),
    heapAfterMb: Number(afterMb),
    reason: tail.split(') ').at(-1).trim(),
    class: classifyKind(kind),
  }
}

function emptySummary() {
  return {
    events: 0,
    scavenges: 0,
    fullGcs: 0,
    others: 0,
    byKind: {},
    firstGcMs: null,
    lastGcMs: null,
    maxHeapBeforeMb: 0,
    maxHeapAfterMb: 0,
  }
}

function tallySummary(summary, event) {
  summary.events += 1
  summary.byKind[event.kind] = (summary.byKind[event.kind] ?? 0) + 1
  if (event.class === 'scavenge') summary.scavenges += 1
  else if (event.class === 'full') summary.fullGcs += 1
  else summary.others += 1
  if (summary.firstGcMs === null) summary.firstGcMs = event.tMs
  summary.lastGcMs = event.tMs
  if (event.heapBeforeMb > summary.maxHeapBeforeMb) summary.maxHeapBeforeMb = event.heapBeforeMb
  if (event.heapAfterMb > summary.maxHeapAfterMb) summary.maxHeapAfterMb = event.heapAfterMb
}

export function parseGcLog(text) {
  const events = []
  const summary = emptySummary()
  for (const line of text.split('\n')) {
    if (!line.includes(' ms: ')) continue
    const event = parseGcLine(line)
    if (!event) continue
    events.push(event)
    tallySummary(summary, event)
  }
  return { events, summary }
}
