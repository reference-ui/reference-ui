/**
 * Same-run phases section renderer for `pnpm agentrs alloc`.
 *
 * It takes the filed alloc meta and emits the phases tables: per-leg phase
 * milliseconds for the GC leg (shipped binary) and the trace leg (instrument
 * build), each reconciling within its own run. The trace-leg compile phase is
 * read against the Rust span from the same run, so the N-API + JSON marshal
 * overhead outside the span guard shows as the delta between them.
 */

import { SYNC_PARTS, renderReconcileLine } from './phases.mjs'

function fmtMs(value) {
  return typeof value === 'number' ? value.toFixed(1) : 'n/a'
}

function phaseMsRow(name, gc, trace) {
  return `| ${name} | ${fmtMs(gc.phases[name])} | ${fmtMs(trace.phases[name])} |`
}

export function allocPhasesLines(meta) {
  const gc = meta.gcPhases
  const trace = meta.tracePhases
  const names = ['startup', ...SYNC_PARTS, 'workerTail']
  return [
    '## Same-run phases (agentrs-phases/1)',
    '',
    'One phases file per worker run; each leg reconciles internally. The GC',
    'placements below still use the spawn-epoch bound (unchanged semantics) —',
    'the phases add the per-stage wall the verdict never had.',
    '',
    '| phase | gc-leg ms | trace-leg ms |',
    '| --- | --- | --- |',
    ...names.map((name) => phaseMsRow(name, gc, trace)),
    `| syncTotal | ${fmtMs(gc.phases.syncTotal)} | ${fmtMs(trace.phases.syncTotal)} |`,
    '',
    `GC leg: ${renderReconcileLine(gc.reconcile)}`,
    `Trace leg: ${renderReconcileLine(trace.reconcile)}`,
    `Compile vs span (same run): compile ${fmtMs(trace.compileVsSpanMs.compile)} ms, span ${fmtMs(trace.compileVsSpanMs.span)} ms, delta ${fmtMs(trace.compileVsSpanMs.delta)} ms (N-API + JSON marshal outside the guard).`,
    '',
  ]
}
