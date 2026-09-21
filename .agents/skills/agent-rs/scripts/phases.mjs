/**
 * Same-run phase boundaries shared by the agentrs instrument legs (procedure
 * agentrs-phases/1). It takes one phases.json per worker run — marks recorded
 * by the real sync path behind REFERENCE_UI_PHASES_OUT — and emits the window
 * edges, timestamp bucketing, and reconciliation checks every leg reuses, so
 * flame samples, libc events, and span dumps all split on identical edges.
 * Durations come from the monotonic clock; unix marks exist only to align
 * foreign timestamps (samply, mach time) post-hoc. Bucketing attributes each
 * event by its start time; durations that cross an edge stay whole with the
 * phase that started them, and the rule is stated everywhere it is used.
 */

import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

export const PHASES_OUT_ENV = 'REFERENCE_UI_PHASES_OUT'
export const PHASES_SCHEMA = 1
export const PHASES_PROCEDURE = 'agentrs-phases/1'

// Phases that sum to syncTotal, in run order (startup lives outside sync).
export const SYNC_PARTS = ['config', 'scan', 'evaluate', 'compile', 'publish', 'syncResidual']
export const WORKER_PARTS = ['startup', 'syncTotal', 'workerTail']

// Window edges as mark pairs. syncResidual owns the two honest gaps (output
// rmdir between config and scan; the return path after publish); workerTail is
// the sample-seal after sync returns. Events outside every window land in
// preMain (before the V8 origin, e.g. dyld) or postWorker (sample print/exit).
const PHASE_WINDOW_MARKS = {
  startup: [['processStart', 'syncStart']],
  config: [['syncStart', 'configEnd']],
  scan: [['scanStart', 'scanEnd']],
  evaluate: [['scanEnd', 'evalEnd']],
  compile: [['compileStart', 'compileEnd']],
  publish: [['compileEnd', 'publishEnd']],
  syncResidual: [['configEnd', 'scanStart'], ['publishEnd', 'syncEnd']],
  workerTail: [['syncEnd', 'workerEnd']],
}

export const JS_SELF_CAVEAT = 'Low JS self % does not bound savings from JS-driven native/fs work. '
  + 'The JS phases (config/scan/evaluate/publish) spend most of their wall inside the native compiler '
  + 'and libc file calls: per-phase wall says where the run went, the flame lib split and the libc census '
  + 'say what it did there. A small JS-self share is compatible with large JS-reachable savings — read the '
  + 'two together, never the self share alone.'

// Every leg points the worker at its own phases file inside the evidence dir
// (created up front — the worker must never mkdir for the harness).
export function phasesEnvFor(evidenceDir, file) {
  mkdirSync(evidenceDir, { recursive: true })
  return { [PHASES_OUT_ENV]: path.join(evidenceDir, file) }
}

export function readPhases(phasesPath, leg) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(phasesPath, 'utf-8'))
  } catch {
    throw new Error(`${leg} leg wrote no phases dump at ${phasesPath}`)
  }
  if (!parsed || parsed.schema !== PHASES_SCHEMA || !parsed.marks || !parsed.phases) {
    throw new Error(`${leg} leg phases dump at ${phasesPath} has an unexpected shape`)
  }
  return parsed
}

function markUnixMs(marks, name) {
  const mark = marks[name]
  return mark && typeof mark.unixMs === 'number' ? mark.unixMs : null
}

export function phaseWindows(phases) {
  const windows = []
  for (const [name, edges] of Object.entries(PHASE_WINDOW_MARKS)) {
    for (const [from, to] of edges) {
      const start = markUnixMs(phases.marks, from)
      const end = markUnixMs(phases.marks, to)
      if (start === null || end === null) continue
      windows.push({ name, start, end })
    }
  }
  windows.sort((a, b) => a.start - b.start)
  return windows
}

export function bucketize(unixMs, windows) {
  for (const window of windows) {
    if (unixMs >= window.start && unixMs < window.end) return window.name
  }
  if (windows.length > 0 && unixMs < windows[0].start) return 'preMain'
  return 'postWorker'
}

function sumOf(phases, names) {
  let sum = 0
  for (const name of names) {
    const value = phases[name]
    if (typeof value !== 'number') return null
    sum += value
  }
  return sum
}

// Mono-derived sums agree to float dust; 0.01 ms bounds it with room while a
// dropped or double-counted phase would miss by whole milliseconds.
const RECONCILE_TOLERANCE_MS = 0.01

export function checkReconciled(phases) {
  const syncSum = sumOf(phases, SYNC_PARTS)
  const workerSum = sumOf(phases, WORKER_PARTS)
  const syncDelta = syncSum === null || typeof phases.syncTotal !== 'number' ? null : syncSum - phases.syncTotal
  const workerDelta = workerSum === null || typeof phases.workerTotal !== 'number' ? null : workerSum - phases.workerTotal
  return {
    syncDeltaMs: syncDelta,
    workerDeltaMs: workerDelta,
    ok: syncDelta !== null && workerDelta !== null
      && Math.abs(syncDelta) <= RECONCILE_TOLERANCE_MS
      && Math.abs(workerDelta) <= RECONCILE_TOLERANCE_MS,
  }
}

function mainThread(profile) {
  return profile.threads.find((entry) => entry.isMainThread) ?? profile.threads[0]
}

// Samply files per-sample timeDeltas (ms, cumulative from meta.startTime);
// older Firefox Profiler files carry absolute `time` instead. Either way the
// output is absolute unix ms per sample, aligned against the phases marks.
function absoluteTimes(thread) {
  const samples = thread.samples
  if (Array.isArray(samples.time) && samples.time.length === samples.length) {
    return { threadName: thread.name, times: [...samples.time] }
  }
  return null
}

function deltaTimes(profile, thread) {
  const samples = thread.samples
  if (!Array.isArray(samples.timeDeltas) || samples.timeDeltas.length !== samples.length) return null
  const start = profile.meta?.startTime
  if (typeof start !== 'number') return null
  const times = new Array(samples.length)
  let cursor = start
  for (let i = 0; i < samples.length; i += 1) {
    cursor += samples.timeDeltas[i]
    times[i] = cursor
  }
  return { threadName: thread.name, times }
}

export function flameSampleTimes(profile) {
  const thread = mainThread(profile)
  if (!thread?.samples || typeof thread.samples.length !== 'number') return null
  return absoluteTimes(thread) ?? deltaTimes(profile, thread)
}

export function sampleWeightOf(thread, index) {
  return thread.samples.weight?.[index] ?? 1
}

// The profile clock starts when samply starts recording (before the child
// spawns), so processStart must fall inside [profileStart, lastSample] and
// close after it — seconds, not minutes. Anything else is a clock jump, and
// bucketing on jumped clocks would file garbage, so the harness fails loud.
const ALIGN_SLACK_MS = 60000

export function checkFlameAlignment(profile, phases) {
  const reconstructed = flameSampleTimes(profile)
  if (!reconstructed) return { ok: false, reason: 'profile carries neither timeDeltas nor time' }
  const profileStart = profile.meta.startTime
  const processStart = markUnixMs(phases.marks, 'processStart')
  if (processStart === null) return { ok: false, reason: 'phases file has no processStart mark' }
  const first = reconstructed.times[0]
  const last = reconstructed.times[reconstructed.times.length - 1]
  const delta = processStart - profileStart
  const ok = delta >= 0 && delta <= ALIGN_SLACK_MS && processStart <= last
  return {
    ok,
    reason: ok ? null : `processStart ${processStart} outside [profileStart ${profileStart}, lastSample ${last}]`,
    profileStartUnixMs: profileStart,
    processStartUnixMs: processStart,
    firstSampleUnixMs: first,
    lastSampleUnixMs: last,
    processStartDeltaMs: delta,
    times: reconstructed.times,
    threadName: reconstructed.threadName,
  }
}

export function bucketWeights(times, weights, windows) {
  const perPhase = {}
  let preMain = 0
  let postWorker = 0
  let total = 0
  for (let i = 0; i < times.length; i += 1) {
    const weight = weights[i]
    total += weight
    const phase = bucketize(times[i], windows)
    if (phase === 'preMain') preMain += weight
    else if (phase === 'postWorker') postWorker += weight
    else perPhase[phase] = (perPhase[phase] ?? 0) + weight
  }
  return { perPhase, preMain, postWorker, total }
}

function fmtMs(value) {
  return typeof value === 'number' ? value.toFixed(1) : 'n/a'
}

function fmtShare(value, total) {
  if (typeof value !== 'number' || !total) return 'n/a'
  return `${((value / total) * 100).toFixed(1)}%`
}

export function renderPhasesTable(phases) {
  const total = phases.syncTotal
  const rows = ['| phase | ms | share of sync |', '| --- | --- | --- |']
  for (const name of ['startup', ...SYNC_PARTS]) {
    rows.push(`| ${name} | ${fmtMs(phases[name])} | ${fmtShare(phases[name], total)} |`)
  }
  rows.push(`| workerTail | ${fmtMs(phases.workerTail)} | ${fmtShare(phases.workerTail, total)} |`)
  rows.push(`| syncTotal | ${fmtMs(phases.syncTotal)} | — |`)
  return rows.join('\n')
}

export function renderReconcileLine(check) {
  if (check.ok) {
    return `RECONCILED — phase sums match to ${Math.abs(check.syncDeltaMs).toFixed(3)} ms (sync) / ${Math.abs(check.workerDeltaMs).toFixed(3)} ms (worker).`
  }
  return `UNRECONCILED — sync delta ${check.syncDeltaMs} ms, worker delta ${check.workerDeltaMs} ms; do not cite.`
}
