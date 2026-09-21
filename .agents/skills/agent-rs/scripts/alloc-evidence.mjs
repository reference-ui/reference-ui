/**
 * Filed evidence writer for `pnpm agentrs alloc`.
 *
 * It takes the capture context, the frozen repo, and both legs (GC census on
 * the shipped binary, Rust span dump on the instrumented one) and emits the
 * evidence directory: meta.json with the full pinned procedure, the raw GC
 * log plus its parsed census, and summary.md rendering the allocation report.
 * The pin follows the bench convention (clean tree hashes, dirty trees
 * overwrite `latest`), and a dirty capture files its git status excerpt.
 */

import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { allocPhasesLines } from './alloc-phases.mjs'
import { checkReconciled } from './phases.mjs'

export function resolveAllocEvidenceDir(repoRoot, options, pin) {
  if (options.outDir) return path.resolve(options.outDir)
  return path.join(repoRoot, 'docs', 'evidence', 'alloc', `${options.scale}-${pin.name}`)
}

function gitStatusExcerpt(repoRoot) {
  try {
    const probe = spawnSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf-8' })
    if (probe.status !== 0 || !probe.stdout) return []
    return probe.stdout.trim().split('\n').slice(0, 20)
  } catch {
    return []
  }
}

function legMeta(leg) {
  return { sample: leg.sample, nodeArgs: leg.nodeArgs, command: leg.command }
}

// Spawn-to-origin latency bound: the child's V8 clock starts after our
// spawn-epoch stamp, so the error is one-sided — events can only shift later,
// never earlier. Calibrated at 28-34ms spawn-to-first-JS (V8 origin earlier);
// 60ms bounds it with room to spare under load.
const SPAWN_LATENCY_BOUND_MS = 60

function placeEvent(event, span, spawnEpochMs) {
  if (!span.startUnixMs || !span.endUnixMs) return 'edge'
  const earliest = spawnEpochMs + event.tMs
  const latest = earliest + SPAWN_LATENCY_BOUND_MS
  if (latest < span.startUnixMs) return 'head'
  if (earliest > span.endUnixMs) return 'tail'
  if (earliest >= span.startUnixMs && latest <= span.endUnixMs) return 'in-window'
  return 'edge'
}

function classifyWindow(events, span, spawnEpochMs) {
  const placements = events.map((event) => ({
    tMs: event.tMs,
    kind: event.kind,
    class: event.class,
    placement: placeEvent(event, span, spawnEpochMs),
  }))
  const full = placements.filter((entry) => entry.class === 'full')
  const count = (placement) => full.filter((entry) => entry.placement === placement).length
  return {
    startUnixMs: span.startUnixMs,
    endUnixMs: span.endUnixMs,
    spawnEpochMs,
    spawnLatencyBoundMs: SPAWN_LATENCY_BOUND_MS,
    inWindowFull: count('in-window'),
    headFull: count('head'),
    tailFull: count('tail'),
    edgeFull: count('edge'),
    placements: placements.filter((entry) => entry.class === 'full'),
  }
}

function gcPhasesMeta(gcLeg) {
  return {
    file: 'gc-phases.json',
    phases: gcLeg.phases.phases,
    reconcile: checkReconciled(gcLeg.phases.phases),
  }
}

function tracePhasesMeta(traceLeg) {
  const compile = traceLeg.phases.phases.compile
  const wallMs = traceLeg.rust.span.wallMs
  return {
    file: 'trace-phases.json',
    phases: traceLeg.phases.phases,
    reconcile: checkReconciled(traceLeg.phases.phases),
    compileVsSpanMs: {
      compile,
      span: wallMs,
      delta: typeof compile === 'number' ? compile - wallMs : null,
    },
  }
}

export function buildAllocMeta(ctx, repo, legs, natives) {
  return {
    procedure: ctx.procedure,
    procedureNote: ctx.procedureNote ?? null,
    scale: ctx.options.scale,
    pin: ctx.pin,
    plan: repo.plan,
    generated: repo.generated,
    gcLeg: { ...legMeta(legs.gc), gc: legs.gc.gcSummary },
    gcPhases: gcPhasesMeta(legs.gc),
    tracePhases: tracePhasesMeta(legs.trace),
    traceLeg: {
      ...legMeta(legs.trace),
      env: legs.trace.env,
      traceGc: legs.trace.traceGcSummary,
      window: classifyWindow(legs.trace.traceGcEvents, legs.trace.rust.span, legs.trace.spawnEpochMs),
      rustSpan: legs.trace.rust.span,
      rustProcess: {
        spans: legs.trace.rust.process.spans,
        allocBytes: legs.trace.rust.process.allocBytes,
        allocBlocks: legs.trace.rust.process.allocBlocks,
        freeBytes: legs.trace.rust.process.freeBytes,
        freeBlocks: legs.trace.rust.process.freeBlocks,
        liveBytes: legs.trace.rust.process.liveBytes,
        peakLiveBytes: legs.trace.rust.process.peakLiveBytes,
      },
    },
    node: { version: process.version },
    nativeShipped: natives.shipped,
    nativeTrace: natives.trace,
    platform: `${process.platform}-${process.arch}`,
    createdAt: new Date().toISOString(),
    treeStatus: ctx.pin.dirty ? gitStatusExcerpt(ctx.repoRoot) : [],
  }
}

function mib(bytes) {
  return `${(bytes / 1048576).toFixed(1)} MiB`
}

function verdictLine(window) {
  if (window.edgeFull > 0) {
    return `AMBIGUOUS — ${window.edgeFull} full GC(s) within the ${window.spawnLatencyBoundMs} ms spawn-latency bound of a window edge; re-run before citing.`
  }
  if (window.inWindowFull === 0) {
    return `PASS — zero in-window mark-sweep/mark-compact (${window.headFull} head, ${window.tailFull} tail); R1's mechanism reproduced by measurement.`
  }
  return `FAIL — ${window.inWindowFull} in-window full GC(s); R1's zero-mark-compact window did NOT reproduce.`
}

function loadLines(meta) {
  const { plan, generated } = meta
  return [
    `# Allocation report: ${meta.scale} (${meta.pin.name})`,
    '',
    `Load: ${generated.styleFiles} style files + ${generated.deadFiles} dead, ${generated.cssCalls} css() calls,`,
    `${generated.recipes} recipes, seed ${plan.seed} (frozen ${plan.generator} plan, no overrides).`,
    `Procedure: \`${meta.procedure}\`${meta.procedureNote ? ` — ${meta.procedureNote}` : ''}. GC leg profiles the shipped release \`.node\`;`,
    'the trace leg profiles the release+alloc-trace instrument build. Worker verbatim both legs.',
    '',
    '## Worker samples per leg',
    '',
    '| leg | syncMs | rssBefore | rssPeak | rssAfter |',
    '| --- | --- | --- | --- | --- |',
    `| gc (shipped) | ${meta.gcLeg.sample.syncMs.toFixed(1)} | ${mib(meta.gcLeg.sample.rssBefore)} | ${mib(meta.gcLeg.sample.rssPeak)} | ${mib(meta.gcLeg.sample.rssAfter)} |`,
    `| trace (instrument) | ${meta.traceLeg.sample.syncMs.toFixed(1)} | ${mib(meta.traceLeg.sample.rssBefore)} | ${mib(meta.traceLeg.sample.rssPeak)} | ${mib(meta.traceLeg.sample.rssAfter)} |`,
    '',
  ]
}

function heapLine(gc) {
  if (gc.events === 0) return 'V8 heap high-water: unobserved (no GC fired in this run).'
  return `V8 heap high-water: ${gc.maxHeapBeforeMb.toFixed(1)} MB before-GC, ${gc.maxHeapAfterMb.toFixed(1)} MB after-GC.`
}

function gcLines(gc) {
  const kinds = Object.entries(gc.byKind)
    .map(([kind, count]) => `${kind} ${count}`)
    .join(', ') || 'no GC events'
  return [
    '## R1 reproduction: GC census (`node --trace-gc`, shipped binary)',
    '',
    `Events: ${gc.events} (${kinds}). First GC at ${gc.firstGcMs ?? '—'} ms, last at ${gc.lastGcMs ?? '—'} ms.`,
    heapLine(gc),
    'R1 reference (Wave 4 hunter-r, enterprise): 12sc/0mc whole-run under both paths.',
    'The whole-run count is the re-measurement; the verdict below places each full GC',
    'against the measured compile window (trace leg), which is what R1 turns on.',
    '',
  ]
}

function windowLines(window, span) {
  const rows = window.placements.map(
    (entry) => `| ${entry.tMs.toFixed(0)} | ${entry.kind} | ${entry.placement} |`,
  )
  return [
    '## Handoff-window verdict (trace leg: span timestamps × same-process GC log)',
    '',
    verdictLine(window),
    '',
    `Window: ${span.wallMs.toFixed(1)} ms blocking call. Event times align to the window via the`,
    `spawn epoch (one-sided ${window.spawnLatencyBoundMs} ms spawn-latency bound; edge hits are ambiguous, never silent).`,
    '',
    '| tMs | kind | placement |',
    '| --- | --- | --- |',
    ...(rows.length > 0 ? rows : ['| — | no full GCs in this run | — |']),
    '',
  ]
}

function bucketRow(bucket) {
  const limit = bucket.maxSize > 131072 ? '>128 KiB' : `<=${bucket.maxSize} B`
  return `| ${limit} | ${mib(bucket.allocBytes)} | ${bucket.allocBlocks} | ${mib(bucket.liveBytes)} |`
}

function zoneLine(span) {
  if (!span.zoneAtExit) return 'Zone: n/a (non-macOS).'
  const reservedDelta = span.zoneAtExit.sizeAllocated - (span.zoneAtEnter?.sizeAllocated ?? 0)
  const inUseDelta = span.zoneAtExit.sizeInUse - (span.zoneAtEnter?.sizeInUse ?? 0)
  return [
    `Zone at exit: ${mib(span.zoneAtExit.sizeAllocated)} reserved / ${mib(span.zoneAtExit.sizeInUse)} in use /`,
    `${mib(span.zoneAtExit.slack)} slack. Compile delta: ${mib(reservedDelta)} reserved, ${mib(inUseDelta)} in use.`,
    'Reserved counts whole region chunks claimed (never-faulted pages included), so it can',
    'exceed RSS; the delta is the compile-attributable part. The zone covers malloc traffic',
    '(Rust + Node C++); the V8 heap is mmap\u2019d outside it, so the slack is the malloc-side story only.',
  ].join('\n')
}

function rustLines(rust) {
  const span = rust.span
  const handed = span.requestJsonBytes + span.filesContentBytes + span.filesPathBytes
  const lines = [
    '## Rust side: reachable-live vs transient vs allocator-resident (compile span)',
    '',
    `Blocking napi call: ${span.wallMs.toFixed(1)} ms. Transient: ${mib(span.freeBytes)} freed in-span`,
    `(${span.freeBlocks} blocks) of ${mib(span.allocBytes)} allocated (${span.allocBlocks} blocks, ${span.reallocs} reallocs).`,
    `Reachable-live (Rust): ${mib(span.liveAtExit)} at span exit (${mib(span.liveAtEnter)} at enter,`,
    `net ${mib(span.netGrowth)} growth), ${mib(span.peakLive)} span peak.`,
    '',
    '### Handed-off bytes (deterministic R1 ledger, measured in-span)',
    '',
    `Files: ${span.fileCount}; contents ${mib(span.filesContentBytes)} + paths ${mib(span.filesPathBytes)}`,
    `+ request JSON ${mib(span.requestJsonBytes)} = ${mib(handed)} handed to the blocking call,`,
    'reachable-live on the JS side through the whole call.',
    '',
    '### Allocator-resident (malloc default zone, whole process)',
    '',
    zoneLine(span),
    '',
    '### Span size classes (process cumulative alloc, live at span exit)',
    '',
    '| class | alloc | blocks | live |',
    '| --- | --- | --- | --- |',
  ]
  for (const bucket of rust.process.buckets) lines.push(bucketRow(bucket))
  lines.push('')
  return lines
}

function rssHeapLine(gc) {
  if (gc.events === 0) return 'V8 heap high-water: unobserved (no GC fired in this run).'
  return `V8 heap high-water: ~${gc.maxHeapBeforeMb.toFixed(0)} MB (mmap\u2019d, outside the malloc zone).`
}

function closingLines(window) {
  if (window.edgeFull > 0 || window.inWindowFull > 0) {
    return [
      'Against R1: a full GC fired in (or at the edge of) the handoff window, so',
      'old-space garbage COULD have moved mid-window; treat this run as one sample and re-run.',
    ]
  }
  return [
    'The legs agree with R1: with no full GC in the window, nulled old-space bytes',
    'cannot leave RSS before the scored peak — the gap above reachable-live is',
    'GC-timing/allocator-resident, not live data.',
  ]
}

function addedLine(meta, rust) {
  const added = meta.gcLeg.sample.rssPeak - meta.gcLeg.sample.rssBefore
  if (added <= 0) return 'Sync-added RSS: n/a (peak did not exceed baseline).'
  const share = ((rust.span.peakLive / added) * 100).toFixed(0)
  return `Sync-added RSS (peak − before): ${mib(added)}; the Rust span peak (${mib(rust.span.peakLive)}) is ~${share}% of it (cross-leg, cross-run read).`
}

function rssLines(meta, gc, rust, window) {
  const peak = meta.gcLeg.sample.rssPeak
  const after = meta.gcLeg.sample.rssAfter
  const cliff = peak - after
  return [
    `## Scored-peak decomposition (${meta.scale} RSS, legs cross-read)`,
    '',
    `Scored peak (GC leg, shipped): ${mib(peak)}; after sync: ${mib(after)} (post-sync cliff ${mib(cliff)}).`,
    addedLine(meta, rust),
    rssHeapLine(gc),
    `Rust reachable-live at compile exit: ${mib(rust.span.liveAtExit)} (trace leg).`,
    `Malloc zone slack at compile exit: ${rust.span.zoneAtExit ? mib(rust.span.zoneAtExit.slack) : 'n/a'}.`,
    ...closingLines(window),
    '',
  ]
}

function artifactLines(meta) {
  return [
    '## Artifacts (which binary is which)',
    '',
    '| build | profile | sha256 | builtVia |',
    '| --- | --- | --- | --- |',
    `| shipped | ${meta.nativeShipped.profile} | \`${meta.nativeShipped.sha256.slice(0, 12)}\u2026\` | ${meta.nativeShipped.builtVia} |`,
    `| trace | ${meta.nativeTrace.profile} | \`${meta.nativeTrace.sha256.slice(0, 12)}\u2026\` | ${meta.nativeTrace.builtVia} |`,
    '',
    `Shipped: \`${meta.nativeShipped.path}\`. Trace: \`${meta.nativeTrace.path}\``,
    `(inputs ${meta.nativeTrace.inputsHash.slice(0, 12)}; dist/native never touched).`,
    '',
  ]
}

export function renderAllocSummary(meta, gc, rust) {
  return [
    ...loadLines(meta),
    ...allocPhasesLines(meta),
    ...gcLines(gc),
    ...windowLines(meta.traceLeg.window, meta.traceLeg.rustSpan),
    ...rustLines(rust),
    ...rssLines(meta, gc, rust, meta.traceLeg.window),
    ...artifactLines(meta),
  ].join('\n')
}

export function writeAllocEvidence(evidenceDir, legs, meta) {
  writeFileSync(path.join(evidenceDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
  writeFileSync(path.join(evidenceDir, 'gc.log'), legs.gc.rawLog)
  writeFileSync(
    path.join(evidenceDir, 'gc.json'),
    `${JSON.stringify({ summary: legs.gc.gcSummary, events: legs.gc.gcEvents }, null, 2)}\n`,
  )
  writeFileSync(path.join(evidenceDir, 'trace-gc.log'), legs.trace.rawLog)
  writeFileSync(
    path.join(evidenceDir, 'trace-gc.json'),
    `${JSON.stringify({ summary: legs.trace.traceGcSummary, events: legs.trace.traceGcEvents }, null, 2)}\n`,
  )
  const summary = renderAllocSummary(meta, legs.gc.gcSummary, legs.trace.rust)
  writeFileSync(path.join(evidenceDir, 'summary.md'), summary)
  return summary
}
