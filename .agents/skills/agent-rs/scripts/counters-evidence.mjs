/**
 * Filed meta builder for `pnpm agentrs counters`.
 *
 * It takes the capture context, the frozen repo, and all three legs (exact
 * window Mach/rusage span, shimmed libc census, bare-node startup baseline)
 * and emits meta.json with the pinned procedure plus derived before/after
 * deltas and ratios. Rendering lives in counters-summary.mjs. The pin follows
 * the bench convention (clean tree hashes, dirty trees overwrite `latest`),
 * and a dirty capture files its git status excerpt.
 */

import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { subtractCensus } from './counters-census.mjs'
import { checkReconciled } from './phases.mjs'

// Conservative sustained issue width for the IPC stall bound (see summary).
export const STALL_WIDTH = 4

export function resolveCountersEvidenceDir(repoRoot, options, pin) {
  if (options.outDir) return path.resolve(options.outDir)
  return path.join(repoRoot, 'docs', 'evidence', 'counters', `${options.scale}-${pin.name}`)
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

function deltaPair(before, after) {
  if (!before || !after) return null
  const delta = {}
  for (const key of Object.keys(before)) {
    if (typeof before[key] === 'number' && typeof after[key] === 'number') delta[key] = after[key] - before[key]
  }
  return delta
}

export function numOf(obj, key) {
  if (!obj) return null
  const value = obj[key]
  return typeof value === 'number' ? value : null
}

export function orZero(value) {
  return typeof value === 'number' ? value : 0
}

function threadRows(digest) {
  if (!digest || !Array.isArray(digest.rows)) return []
  return digest.rows
}

function threadSums(digest) {
  if (!digest) return null
  const sums = { count: orZero(digest.count), userUsec: 0, sysUsec: 0 }
  for (const row of threadRows(digest)) {
    sums.userUsec += orZero(row.userUsec)
    sums.sysUsec += orZero(row.sysUsec)
  }
  return sums
}

function threadById(digest) {
  const byId = new Map()
  for (const row of threadRows(digest)) {
    if (typeof row.threadId === 'number') byId.set(row.threadId, row)
  }
  return byId
}

function matchedDelta(enter, row) {
  const first = enter.get(row.threadId)
  return {
    userUsec: orZero(row.userUsec) - orZero(first.userUsec),
    sysUsec: orZero(row.sysUsec) - orZero(first.sysUsec),
  }
}

function windowThreadDeltas(before, after) {
  const enter = threadById(before)
  const deltas = []
  for (const row of threadRows(after)) {
    if (typeof row.threadId !== 'number' || !enter.has(row.threadId)) continue
    deltas.push(matchedDelta(enter, row))
  }
  return deltas
}

function windowTopShare(before, after) {
  const deltas = windowThreadDeltas(before, after)
  let total = 0
  let top = 0
  for (const delta of deltas) {
    const sum = delta.userUsec + delta.sysUsec
    total += sum
    if (sum > top) top = sum
  }
  if (total <= 0) return null
  return top / total
}

function deriveThreads(before, after) {
  const enter = threadSums(before)
  const exit = threadSums(after)
  if (!enter || !exit) return null
  return {
    enterCount: enter.count,
    exitCount: exit.count,
    userUsecDelta: exit.userUsec - enter.userUsec,
    sysUsecDelta: exit.sysUsec - enter.sysUsec,
    windowTopShare: windowTopShare(before, after),
  }
}

function ipcOf(instructions, cycles) {
  if (instructions === null || !cycles) return null
  return instructions / cycles
}

function stallOf(instructions, cycles) {
  if (instructions === null || !cycles) return null
  return Math.max(0, cycles - instructions / STALL_WIDTH)
}

function shareOf(part, whole) {
  if (part === null || !whole) return null
  return part / whole
}

// High-water marks are monotonic: their enter/exit difference is meaningless,
// so they ride as exit values beside the deltas instead of inside them.
function exitWaters(span) {
  return {
    lifetimeMaxPhysFootprint: numOf(span.after.rusageInfo, 'lifetimeMaxPhysFootprint'),
    maxRss: numOf(span.after.rusage, 'maxRss'),
  }
}

function scrubWaters(info, rusage) {
  if (info) delete info.lifetimeMaxPhysFootprint
  if (rusage) delete rusage.maxRss
}

export function deriveSpan(span, spans = null) {
  const events = deltaPair(span.before.taskEvents, span.after.taskEvents)
  const info = deltaPair(span.before.rusageInfo, span.after.rusageInfo)
  const rusage = deltaPair(span.before.rusage, span.after.rusage)
  scrubWaters(info, rusage)
  const threads = deriveThreads(span.before.threads, span.after.threads)
  const instructions = numOf(info, 'instructions')
  const cycles = numOf(info, 'cycles')
  const stallCycles = stallOf(instructions, cycles)
  return {
    wallMs: span.wallMs,
    spans,
    events,
    info,
    rusage,
    threads,
    exitWaters: exitWaters(span),
    instructions,
    cycles,
    ipc: ipcOf(instructions, cycles),
    stallWidth: STALL_WIDTH,
    stallCycles,
    stallShare: shareOf(stallCycles, cycles),
  }
}

function legMeta(leg) {
  return { sample: leg.sample, nodeArgs: leg.nodeArgs, command: leg.command, env: leg.env }
}

function spanPhasesMeta(spanLeg) {
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

function censusPhasesMeta(censusLeg) {
  return {
    file: 'census-phases.json',
    phases: censusLeg.phases.phases,
    reconcile: checkReconciled(censusLeg.phases.phases),
    events: censusLeg.events,
    byPhase: censusLeg.bucketed.phases,
    unplaced: censusLeg.bucketed.unplaced,
  }
}

export function buildCountersMeta(ctx, repo, legs, natives) {
  const censusNet = subtractCensus(legs.census.census, legs.startup.census)
  return {
    procedure: ctx.procedure,
    procedureNote: ctx.procedureNote ?? null,
    scale: ctx.options.scale,
    pin: ctx.pin,
    plan: repo.plan,
    generated: repo.generated,
    spanLeg: { ...legMeta(legs.span), spanWallMs: legs.span.span.span.wallMs, spans: legs.span.span.spans },
    censusLeg: legMeta(legs.census),
    startupLeg: { command: [process.execPath, '-e', ''] },
    spanPhases: spanPhasesMeta(legs.span),
    censusPhases: censusPhasesMeta(legs.census),
    censusNet,
    derived: deriveSpan(legs.span.span.span, legs.span.span.spans ?? null),
    node: { version: process.version },
    nativeShipped: natives.shipped,
    nativeCounters: natives.counters,
    shim: { source: natives.shim.source, sourceSha256: natives.shim.sourceSha256, cc: natives.shim.cc },
    platform: `${process.platform}-${process.arch}`,
    createdAt: new Date().toISOString(),
    treeStatus: ctx.pin.dirty ? gitStatusExcerpt(ctx.repoRoot) : [],
  }
}

export function writeCountersMeta(evidenceDir, meta) {
  writeFileSync(path.join(evidenceDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
}
