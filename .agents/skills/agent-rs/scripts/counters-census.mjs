/**
 * Libc census leg for `pnpm agentrs counters`.
 *
 * It takes the interpose shim source and emits a compiled dylib plus the
 * parsed census: per-libc-call counts, nanoseconds, and bytes for the whole
 * worker run. A bare `node -e ''` startup census runs under the same shim so
 * the harness can subtract node-init noise; the net is the sync-attributable
 * file-IO story. Wall time from this leg is unscored — the counts are the
 * instrument, and they only see calls routed through libc. When the shim also
 * files its timestamped event log, this module buckets every call into the
 * same-run phase windows and proves the buckets against the schema-1 census.
 */

import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { bucketize } from './phases.mjs'

export const CENSUS_OUT_ENV = 'COUNTERS_CENSUS_OUT'
export const CENSUS_EVENTS_OUT_ENV = 'COUNTERS_CENSUS_EVENTS_OUT'
export const SHIM_SOURCE = 'counters-interpose.c'

function scriptsDir() {
  return new URL('.', import.meta.url).pathname
}

export function shimSourcePath() {
  return path.join(scriptsDir(), SHIM_SOURCE)
}

function ccVersion() {
  const probe = spawnSync('cc', ['--version'], { encoding: 'utf-8' })
  if (probe.status === 0 && probe.stdout) return probe.stdout.split('\n')[0].trim()
  return 'unknown'
}

export function buildCountersShim() {
  const source = shimSourcePath()
  const dir = mkdtempSync(path.join(tmpdir(), 'neo-counters-shim-'))
  const dylib = path.join(dir, 'libcounters-interpose.dylib')
  const build = spawnSync('cc', ['-dynamiclib', '-O2', '-o', dylib, source], { encoding: 'utf-8' })
  if (build.status !== 0) {
    throw new Error(`counters shim build failed: ${(build.stderr || build.stdout || '').trim() || `code ${build.status}`}`)
  }
  return {
    dylib,
    dir,
    source: path.relative(process.cwd(), source) || source,
    cc: ccVersion(),
    sourceSha256: createHash('sha256').update(readFileSync(source)).digest('hex'),
  }
}

function spawnCapture(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf-8')
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf-8')
    })
    child.on('error', (err) => resolve({ code: 1, stdout, stderr, error: err.message }))
    child.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }))
  })
}

export async function runShimmed(command, args, env) {
  return spawnCapture(command, args, env)
}

export function readCensus(censusPath, leg) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(censusPath, 'utf-8'))
  } catch {
    throw new Error(`${leg} leg wrote no census dump at ${censusPath}`)
  }
  if (!parsed || parsed.schema !== 1 || !parsed.calls || typeof parsed.calls !== 'object') {
    throw new Error(`${leg} leg census dump at ${censusPath} has an unexpected shape`)
  }
  return parsed
}

function numOrZero(row, key) {
  const value = row[key]
  return typeof value === 'number' ? value : 0
}

function wantsKey(full, base, key) {
  return typeof full[key] === 'number' || typeof base[key] === 'number'
}

function isNegative(row) {
  if (row.count < 0) return true
  if (typeof row.totalNs === 'number' && row.totalNs < 0) return true
  return typeof row.bytes === 'number' && row.bytes < 0
}

function netRow(name, full, base) {
  const row = { count: numOrZero(full, 'count') - numOrZero(base, 'count') }
  if (wantsKey(full, base, 'totalNs')) row.totalNs = numOrZero(full, 'totalNs') - numOrZero(base, 'totalNs')
  if (wantsKey(full, base, 'bytes')) row.bytes = numOrZero(full, 'bytes') - numOrZero(base, 'bytes')
  if (isNegative(row)) row.noisy = true
  return [name, row]
}

export function subtractCensus(census, startup) {
  const names = new Set([...Object.keys(census.calls), ...Object.keys(startup.calls)])
  const net = {}
  for (const name of names) {
    const [key, row] = netRow(name, census.calls[name] ?? {}, startup.calls[name] ?? {})
    net[key] = row
  }
  return { schema: 1, calls: net }
}

function validAnchor(anchor, timebase) {
  if (!anchor || !timebase) return false
  if (typeof anchor.startUnixMs !== 'number' || typeof anchor.startTicks !== 'number') return false
  return typeof timebase.num === 'number' && timebase.den > 0
}

function validEventsShape(parsed) {
  if (!parsed || parsed.schema !== 1) return false
  if (!Array.isArray(parsed.calls) || !Array.isArray(parsed.events)) return false
  return validAnchor(parsed.anchor, parsed.timebase)
}

export function readCensusEvents(eventsPath, leg) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(eventsPath, 'utf-8'))
  } catch {
    throw new Error(`${leg} leg wrote no census events at ${eventsPath}`)
  }
  if (!validEventsShape(parsed)) {
    throw new Error(`${leg} leg census events at ${eventsPath} have an unexpected shape`)
  }
  return parsed
}

// Mach ticks to unix ms via the constructor anchor. Past 2^53 ticks JSON
// rounds to whole ticks, but the error stays sub-microsecond against
// millisecond phase edges — bucketing never notices.
export function eventUnixMs(event, log) {
  const offsetMs = ((event[1] - log.anchor.startTicks) * log.timebase.num) / log.timebase.den / 1e6
  return log.anchor.startUnixMs + offsetMs
}

function freshCallRow() {
  return { count: 0, totalNs: 0, bytes: 0 }
}

function addEventRow(totals, callName, event) {
  let row = totals[callName]
  if (!row) {
    row = freshCallRow()
    totals[callName] = row
  }
  row.count += 1
  row.totalNs += event[2]
  row.bytes += event[3]
}

function freshPhaseBucket() {
  return { count: 0, totalNs: 0, bytes: 0, byCall: {} }
}

function bucketOf(buckets, phase) {
  let bucket = buckets[phase]
  if (!bucket) {
    bucket = freshPhaseBucket()
    buckets[phase] = bucket
  }
  return bucket
}

function attributeCensusEvent(ctx, event) {
  const callName = ctx.names[event[0]] ?? `call${event[0]}`
  addEventRow(ctx.totals, callName, event)
  const phase = bucketize(eventUnixMs(event, ctx.log), ctx.windows)
  const bucket = phase === 'preMain' || phase === 'postWorker' ? bucketOf(ctx.unplaced, phase) : bucketOf(ctx.phases, phase)
  bucket.count += 1
  bucket.totalNs += event[2]
  bucket.bytes += event[3]
  addEventRow(bucket.byCall, callName, event)
}

// Buckets the timestamped event log into the same-run phase windows. Every
// event lands in exactly one bucket, so the bucket sums always equal the
// log totals — and the log totals must equal the schema-1 census beside it
// (same code path, same t0/t1 sample), which checkEventsAgainstCensus proves.
export function bucketCensusEvents(log, windows) {
  const ctx = { log, names: log.calls, windows, phases: {}, unplaced: {}, totals: {} }
  for (const event of log.events) attributeCensusEvent(ctx, event)
  return { phases: ctx.phases, unplaced: ctx.unplaced, totals: ctx.totals }
}

function checkDropped(log) {
  if ((log.dropped ?? 0) > 0) {
    throw new Error(`census event log dropped ${log.dropped} of ${log.count} events past the ${log.events.length}-slot buffer — re-run; partial buckets are not filed`)
  }
}

function numField(row, key) {
  if (!row) return 0
  if (typeof row[key] !== 'number') return 0
  return row[key]
}

function checkEventRow(callName, events, census) {
  const row = census.calls[callName]
  const sameCount = events.count === numField(row, 'count')
  const sameNs = events.totalNs === numField(row, 'totalNs')
  const sameBytes = events.bytes === numField(row, 'bytes')
  if (sameCount && sameNs && sameBytes) return
  const censusText = `${numField(row, 'count')}/${numField(row, 'totalNs')}/${numField(row, 'bytes')}`
  throw new Error(`census event log disagrees with the schema-1 census on ${callName}: events ${events.count}/${events.totalNs}/${events.bytes} vs census ${censusText}`)
}

export function checkEventsAgainstCensus(log, bucketed, census) {
  checkDropped(log)
  for (const [callName, row] of Object.entries(bucketed.totals)) checkEventRow(callName, row, census)
  for (const callName of Object.keys(census.calls)) {
    if (!bucketed.totals[callName] && (census.calls[callName].count ?? 0) > 0) {
      throw new Error(`schema-1 census counts ${callName} but the event log has no ${callName} events`)
    }
  }
}
