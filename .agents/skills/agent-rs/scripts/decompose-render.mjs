/**
 * Filed-markdown renderer for `pnpm agentrs decompose` (agentrs-phases/1).
 *
 * It takes the joined decomposition object and emits decomposition.md: the
 * reconciled per-phase sync table with the flame run canonical, the per-phase
 * instrument reads, the compile close-up, and the JS-self caveat beside the
 * numbers it guards. Numbers arrive verified — this module formats, it never
 * derives — so the filed prose cannot drift from decomposition.json.
 */

import { JS_SELF_CAVEAT, SYNC_PARTS } from './phases.mjs'

function fmtMs(value) {
  return typeof value === 'number' ? value.toFixed(1) : 'n/a'
}

function fmtInt(value) {
  if (value === null || value === undefined) return 'n/a'
  return Math.round(value).toLocaleString('en-US')
}

function fmtShare(value, total) {
  if (typeof value !== 'number' || !total) return 'n/a'
  return `${((value / total) * 100).toFixed(1)}%`
}

function loadLines(decomp) {
  const { plan, generated } = decomp.load
  const sources = decomp.sources
  return [
    `# Reconciled sync decomposition: ${decomp.scale} (agentrs-phases/1)`,
    '',
    `Load: ${generated.styleFiles} style files + ${generated.deadFiles} dead, ${generated.cssCalls} css() calls,`,
    `${generated.recipes} recipes, seed ${plan.seed} (frozen ${plan.generator} plan, no overrides).`,
    `Canonical run: flame leg (shipped .node, whole worker, procedure \`${sources.flame.procedure}\`).`,
    '',
    '| bundle | procedure | captured |',
    '| --- | --- | --- |',
    `| flame | \`${sources.flame.procedure}\` | ${sources.flame.createdAt} |`,
    `| counters | \`${sources.counters.procedure}\` | ${sources.counters.createdAt} |`,
    `| alloc | \`${sources.alloc.procedure}\` | ${sources.alloc.createdAt} |`,
    '',
  ]
}

function blockLines(decomp) {
  const c = decomp.phases
  const ms = (name) => fmtMs(c[name].runs.flame)
  return [
    '## The decomposition (canonical: flame run)',
    '',
    '```',
    `sync ≈ ${ms('syncTotal')} ms = config ${ms('config')} + scan ${ms('scan')} + evaluate ${ms('evaluate')} + compile ${ms('compile')} + publish ${ms('publish')} (+ residual ${ms('syncResidual')})`,
    `startup ${ms('startup')} ms sits outside sync (fresh-process cost); worker total ${ms('workerTotal')} ms.`,
    '```',
    '',
    'Each column below reconciles within its own run; the spread column shows',
    'how far the five runs disagree per phase (all five run the same frozen load).',
    'Spread mixes wall jitter with instrument overhead (sampling, shim, alloc',
    'counting); per-column reconciliation is the exact claim, spread is context.',
    '',
    '| phase | flame | span | census | gc | trace | spread |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...['startup', ...SYNC_PARTS, 'workerTail', 'syncTotal', 'workerTotal'].map((name) => {
      const row = c[name].runs
      return `| ${name} | ${fmtMs(row.flame)} | ${fmtMs(row.span)} | ${fmtMs(row.census)} | ${fmtMs(row.gc)} | ${fmtMs(row.trace)} | ${fmtMs(c[name].spread)} |`
    }),
    '',
  ]
}

function readsLines(decomp) {
  const sync = decomp.phases.syncTotal.runs.flame
  const rows = ['startup', ...SYNC_PARTS].map((name) => {
    const row = decomp.phases[name]
    const share = name === 'startup' ? '—' : fmtShare(row.runs.flame, sync)
    return `| ${name} | ${fmtMs(row.runs.flame)} | ${share} | ${fmtInt(row.flameWeight)} | ${fmtInt(row.censusCalls)} | ${fmtMs(row.censusMs)} | ${row.topCall} |`
  })
  return [
    '## Per-phase instrument reads (canonical ms, same-run buckets)',
    '',
    '| phase | ms | share | flame wt | census calls | census ms | top census call |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    `| preMain | — | — | ${fmtInt(decomp.unplaced.flamePreMain)} | ${fmtInt(decomp.unplaced.censusPreMain)} | ${fmtMs(decomp.unplaced.censusPreMainMs)} | — |`,
    `| postWorker | — | — | ${fmtInt(decomp.unplaced.flamePostWorker)} | ${fmtInt(decomp.unplaced.censusPostWorker)} | ${fmtMs(decomp.unplaced.censusPostWorkerMs)} | — |`,
    '',
    'Attribution rule: each sample/event counts fully in the phase containing',
    'its start timestamp; durations crossing an edge stay with the starting phase.',
    'Weight ≈ ms at the profile rate; census ms is libc time inside the phase.',
    '',
  ]
}

function compileLines(decomp) {
  const compile = decomp.compile
  return [
    '## Compile under the lens (same-run instruments)',
    '',
    `Compile phase (canonical): ${fmtMs(compile.compileMsCanonical)} ms.`,
    `Counters span (same run as the span-leg phases): ${fmtMs(compile.spanWallMs)} ms blocking, ${fmtInt(compile.instructions)} instructions, IPC ${compile.ipc === null ? 'n/a' : compile.ipc.toFixed(2)}.`,
    `Alloc span (same run as the trace-leg phases): ${fmtMs(compile.allocWallMs)} ms blocking, ${fmtMs(compile.allocBytes / 1048576)} MiB allocated, ${fmtInt(compile.reallocs)} reallocs, ${fmtMs(compile.peakLive / 1048576)} MiB span peak.`,
    `Marshal delta (compile phase − span, same run): ${fmtMs(compile.marshalDeltaSpan)} ms on the counters leg, ${fmtMs(compile.marshalDeltaAlloc)} ms on the alloc leg — N-API + JSON marshal plus the await hop, real compile-phase cost outside the guard.`,
    `GC verdict (alloc bundle): ${compile.gcVerdict}.`,
    '',
  ]
}

function caveatLines() {
  return [
    '## Caveat: JS self does not bound JS-reachable savings',
    '',
    JS_SELF_CAVEAT,
    '',
  ]
}

function checksLines(decomp) {
  const checks = decomp.checks
  return [
    '## Checks (re-derived from bundle raws before joining)',
    '',
    `- Load match: ${checks.loadMatch}.`,
    `- Reconcile: ${checks.reconcile}.`,
    `- Flame buckets reproduced from profile.json.gz + phases.json: ${checks.flameBuckets}.`,
    `- Census buckets reproduced from census-events.json + census-phases.json: ${checks.censusBuckets}.`,
    `- Census buckets proven against the schema-1 census.json: ${checks.censusProof}.`,
    `- Alloc phases reproduced from gc/trace-phases.json: ${checks.allocPhases}.`,
    '',
  ]
}

function changedLines() {
  return [
    '## What changed vs recon §2',
    '',
    'Before (mixed windows): whole-worker flame shares × post-import syncMs,',
    'an empty-process-subtracted libc census, and a span from another run —',
    'per-stage milliseconds that never shared a clock.',
    'After (this file): every stage measured inside one run on common edges,',
    'startup included instead of subtracted, and the compile-phase marshal',
    'delta (phase − span) visible for the first time.',
    '',
  ]
}

function reproLines(decomp) {
  return [
    '## Reproduction',
    '',
    '```bash',
    `pnpm agentrs flame -- ${decomp.scale} --out <flameDir>`,
    `pnpm agentrs counters -- ${decomp.scale} --out <countersDir>`,
    `pnpm agentrs alloc -- ${decomp.scale} --out <allocDir>`,
    'pnpm agentrs decompose --flame <flameDir> --counters <countersDir> --alloc <allocDir> [--out dir]',
    '```',
    '',
  ]
}

export function renderDecompositionMarkdown(decomp) {
  return [
    ...loadLines(decomp),
    ...blockLines(decomp),
    ...readsLines(decomp),
    ...compileLines(decomp),
    ...caveatLines(),
    ...checksLines(decomp),
    ...changedLines(),
    ...reproLines(decomp),
  ].join('\n')
}
