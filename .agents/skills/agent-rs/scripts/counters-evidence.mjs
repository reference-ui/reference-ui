/**
 * Filed meta builder for `pnpm agentrs counters`.
 *
 * It takes the capture context, the frozen repo, and all three legs (exact
 * window Mach/rusage span, shimmed libc census, bare-node startup baseline)
 * and emits meta.json with the pinned procedure plus derived before/after
 * deltas and ratios. Rendering lives in counters-summary.mjs. The pin follows
 * the bench convention (clean tree hashes, dirty trees overwrite `latest`),
 * and a dirty capture files its git status excerpt. Filed bundles can also be
 * reprocessed without re-recording (see counters-resummarize.mjs): the raw
 * dumps are copied aside untouched and every derivation re-runs under the
 * current procedure, with the source bundle named in resummarizedFrom.
 */

import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { subtractCensus } from './counters-census.mjs'
import { censusPhasesMeta, spanPhasesMeta } from './counters-phases.mjs'

export function resolveCountersEvidenceDir(repoRoot, options, pin) {
  if (options.outDir) return path.resolve(options.outDir)
  return path.join(repoRoot, 'docs', 'evidence', 'counters', `${options.scale}-${pin.name}`)
}

export function gitStatusExcerpt(repoRoot) {
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

function bornDelta(row) {
  // A thread absent from the enter snapshot was born inside the window, so
  // its whole lifetime (the exit row as-is) is window CPU — exact, not a bound.
  return { userUsec: orZero(row.userUsec), sysUsec: orZero(row.sysUsec) }
}

function collectExitDeltas(enter, after) {
  const seen = new Set()
  const deltas = []
  let bornCount = 0
  let bornUsec = 0
  for (const row of threadRows(after)) {
    if (typeof row.threadId !== 'number') continue
    seen.add(row.threadId)
    const born = !enter.has(row.threadId)
    const delta = born ? bornDelta(row) : matchedDelta(enter, row)
    if (born) {
      bornCount += 1
      bornUsec += delta.userUsec + delta.sysUsec
    }
    deltas.push(delta)
  }
  return { deltas, seen, bornCount, bornUsec }
}

function windowThreadDeltas(before, after) {
  const enter = threadById(before)
  const collected = collectExitDeltas(enter, after)
  let diedCount = 0
  for (const id of enter.keys()) {
    if (!collected.seen.has(id)) diedCount += 1
  }
  return { ...collected, diedCount }
}

function sumDeltas(deltas) {
  const sums = { userUsec: 0, sysUsec: 0 }
  for (const delta of deltas) {
    sums.userUsec += delta.userUsec
    sums.sysUsec += delta.sysUsec
  }
  return sums
}

function topShareOf(deltas) {
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

function rusageWindowUsec(rusage) {
  if (!rusage) return 0
  return orZero(rusage.userUsec) + orZero(rusage.systemUsec)
}

function deriveThreads(before, after, rusage) {
  const enter = threadSums(before)
  const exit = threadSums(after)
  if (!enter || !exit) return null
  const window = windowThreadDeltas(before, after)
  const attributed = sumDeltas(window.deltas)
  // Died threads leave no exit row, but the process-level rusage delta still
  // counts their window CPU — so the unattributed remainder bounds them.
  const rusageUsec = rusageWindowUsec(rusage)
  const attributedUsec = attributed.userUsec + attributed.sysUsec
  const unattributedUsec = Math.max(0, rusageUsec - attributedUsec)
  return {
    enterCount: enter.count,
    exitCount: exit.count,
    bornCount: window.bornCount,
    diedCount: window.diedCount,
    userUsecDelta: attributed.userUsec,
    sysUsecDelta: attributed.sysUsec,
    bornUsec: window.bornUsec,
    attributedUsec,
    unattributedUsec,
    unattributedShare: rusageUsec > 0 ? unattributedUsec / rusageUsec : null,
    windowTopShare: topShareOf(window.deltas),
  }
}

function ipcOf(instructions, cycles) {
  if (instructions === null || !cycles) return null
  return instructions / cycles
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
  const threads = deriveThreads(span.before.threads, span.after.threads, rusage)
  const instructions = numOf(info, 'instructions')
  const cycles = numOf(info, 'cycles')
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
  }
}

function legMeta(leg) {
  return { sample: leg.sample, nodeArgs: leg.nodeArgs, command: leg.command, env: leg.env }
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
