/**
 * Same-run phases section renderer for `pnpm agentrs counters`.
 *
 * It takes the filed counters meta and emits the phases tables: per-leg phase
 * milliseconds plus the libc event buckets per phase with the top call beside
 * each. The span-leg compile phase is read against the exact-window span from
 * the same run, and both legs carry their reconciliation verdicts. Attribution
 * rule: each libc event counts fully in the phase containing its start time.
 */

import { SYNC_PARTS, checkReconciled, renderReconcileLine } from './phases.mjs'

export function spanPhasesMeta(spanLeg) {
  const compile = spanLeg.phases.phases.compile
  const wallMs = spanLeg.span.span.wallMs
  return {
    file: 'span-phases.json',
    phases: spanLeg.phases.phases,
    reconcile: checkReconciled(spanLeg.phases.phases),
    compileVsSpanMs: {
      compile,
      span: wallMs,
      delta: typeof compile === 'number' ? compile - wallMs : null,
    },
  }
}

export function censusPhasesMeta(censusLeg) {
  return {
    file: 'census-phases.json',
    phases: censusLeg.phases.phases,
    reconcile: checkReconciled(censusLeg.phases.phases),
    events: censusLeg.events,
    byPhase: censusLeg.bucketed.phases,
    unplaced: censusLeg.bucketed.unplaced,
  }
}

function fmtInt(value) {
  if (value === null || value === undefined) return 'n/a'
  return Math.round(value).toLocaleString('en-US')
}

function fmtFixed(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a'
  return value.toFixed(digits)
}

function topCallOf(bucket) {
  let top = { name: '—', totalNs: 0 }
  for (const [name, row] of Object.entries(bucket.byCall ?? {})) {
    if ((row.totalNs ?? 0) > top.totalNs) top = { name, totalNs: row.totalNs }
  }
  return top
}

function phaseMsRow(name, span, census) {
  return `| ${name} | ${fmtFixed(span.phases[name])} | ${fmtFixed(census.phases[name])} |`
}

function phaseIoCells(bucket) {
  if (!bucket) return '| 0 | n/a | — |'
  const top = topCallOf(bucket)
  return `| ${fmtInt(bucket.count)} | ${fmtFixed(bucket.totalNs / 1e6, 2)} | ${top.name} (${fmtFixed(top.totalNs / 1e6, 2)}) |`
}

function phaseIoRow(name, census) {
  return `| ${name} ${phaseIoCells(census.byPhase[name])}`
}

function unplacedIoRow(name, census) {
  return `| ${name} ${phaseIoCells(census.unplaced[name])}`
}

export function countersPhasesLines(meta) {
  const span = meta.spanPhases
  const census = meta.censusPhases
  if (!span || !census) return []
  const names = ['startup', ...SYNC_PARTS, 'workerTail']
  return [
    '## Same-run phases (agentrs-phases/1)',
    '',
    'One phases file per worker run; the span leg and the census leg each',
    'reconcile internally, and the libc events bucket into the census run\'s',
    'own windows. Startup is measured in-run now — the startup-subtracted net',
    'above stays for v1 comparability.',
    '',
    '| phase | span-leg ms | census-leg ms |',
    '| --- | --- | --- |',
    ...names.map((name) => phaseMsRow(name, span, census)),
    `| syncTotal | ${fmtFixed(span.phases.syncTotal)} | ${fmtFixed(census.phases.syncTotal)} |`,
    '',
    '| phase | census calls | census ms | top call (ms) |',
    '| --- | --- | --- | --- |',
    ...names.map((name) => phaseIoRow(name, census)),
    unplacedIoRow('preMain', census),
    unplacedIoRow('postWorker', census),
    '',
    `Span leg: ${renderReconcileLine(span.reconcile)}`,
    `Census leg: ${renderReconcileLine(census.reconcile)}`,
    `Compile vs span (same run): compile ${fmtFixed(span.compileVsSpanMs.compile)} ms, span ${fmtFixed(span.compileVsSpanMs.span)} ms, delta ${fmtFixed(span.compileVsSpanMs.delta)} ms (N-API + await overhead outside the guard).`,
    `Events: ${fmtInt(census.events.count)} bucketed, ${fmtInt(census.events.dropped)} dropped; buckets proven against the schema-1 census beside the log.`,
    '',
  ]
}
