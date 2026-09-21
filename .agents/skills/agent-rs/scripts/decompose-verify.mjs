/**
 * Bundle re-verification for `pnpm agentrs decompose` (agentrs-phases/1).
 *
 * It takes one filed bundle directory plus its meta and re-derives the filed
 * numbers from the bundle's own raw files: the flame profile plus phases dump
 * re-bucket, the census event log re-buckets and re-proves against the raw
 * schema-1 census, and every phases dump re-checks its reconciliation. Any
 * disagreement throws with the raw-vs-filed pair named, so the join only ever
 * reads numbers the raws reproduce exactly.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { bucketCensusEvents, checkEventsAgainstCensus, readCensus, readCensusEvents } from './counters-census.mjs'
import { indexSidecar, loadProfile, summarizePhaseBuckets } from './flame-summary.mjs'
import { SYNC_PARTS, checkReconciled, phaseWindows, readPhases } from './phases.mjs'

const PHASE_NAMES = ['startup', ...SYNC_PARTS, 'workerTail', 'syncTotal', 'workerTotal']

function comparePhaseTables(fresh, filed, what) {
  for (const name of PHASE_NAMES) {
    if (fresh[name] !== filed[name]) {
      throw new Error(`${what} disagree on ${name}: raw ${fresh[name]} vs filed ${filed[name]}`)
    }
  }
}

function compareBucketRow(fresh, filed, index) {
  const same = fresh.name === filed.name && fresh.ms === filed.ms && fresh.weight === filed.weight
    && fresh.topLib === filed.topLib && fresh.topLibWeight === filed.topLibWeight
  if (!same) throw new Error(`flame bucket row ${index} not reproduced: raw ${JSON.stringify(fresh)} vs filed ${JSON.stringify(filed)}`)
}

function compareWeightSums(buckets, filed, weightSum) {
  const total = buckets.rows.reduce((sum, row) => sum + row.weight, 0) + buckets.preMain + buckets.postWorker
  if (total !== weightSum) {
    throw new Error(`flame weights do not sum to the filed total: rows+pre+post ${total} vs weightSum ${weightSum}`)
  }
  if (buckets.preMain !== filed.preMainWeight || buckets.postWorker !== filed.postWorkerWeight) {
    throw new Error('flame unplaced weights not reproduced from the profile')
  }
}

export function verifyFlameBundle(dir, meta) {
  const phases = readPhases(path.join(dir, 'phases.json'), 'flame')
  if (!checkReconciled(phases.phases).ok) throw new Error('flame phases.json does not reconcile')
  comparePhaseTables(phases.phases, meta.phases.phases, 'flame phases.json vs meta')
  const profile = loadProfile(path.join(dir, 'profile.json.gz'))
  const index = indexSidecar(JSON.parse(readFileSync(path.join(dir, 'profile.json.syms.json'), 'utf-8')))
  const buckets = summarizePhaseBuckets(profile, index, phases)
  if (buckets.rows.length !== meta.phases.buckets.length) {
    throw new Error(`flame bucket row count not reproduced: raw ${buckets.rows.length} vs filed ${meta.phases.buckets.length}`)
  }
  buckets.rows.forEach((row, i) => compareBucketRow(row, meta.phases.buckets[i], i))
  compareWeightSums(buckets, meta.phases, meta.phases.weightSum)
  return { phases: phases.phases, buckets }
}

function compareCallRows(fresh, filed, what) {
  const freshNames = Object.keys(fresh).sort()
  const filedNames = Object.keys(filed).sort()
  if (freshNames.join(',') !== filedNames.join(',')) {
    throw new Error(`${what} call sets differ: raw [${freshNames}] vs filed [${filedNames}]`)
  }
  for (const name of freshNames) {
    const a = fresh[name]
    const b = filed[name]
    if (a.count !== b.count || a.totalNs !== b.totalNs || a.bytes !== b.bytes) {
      throw new Error(`${what} ${name} not reproduced: raw ${a.count}/${a.totalNs}/${a.bytes} vs filed ${b.count}/${b.totalNs}/${b.bytes}`)
    }
  }
}

function compareCensusBuckets(fresh, filed, what) {
  const freshNames = Object.keys(fresh).sort()
  const filedNames = Object.keys(filed).sort()
  if (freshNames.join(',') !== filedNames.join(',')) {
    throw new Error(`${what} phase sets differ: raw [${freshNames}] vs filed [${filedNames}]`)
  }
  for (const name of freshNames) {
    const a = fresh[name]
    const b = filed[name]
    if (a.count !== b.count || a.totalNs !== b.totalNs || a.bytes !== b.bytes) {
      throw new Error(`${what} ${name} totals not reproduced: raw ${a.count}/${a.totalNs}/${a.bytes} vs filed ${b.count}/${b.totalNs}/${b.bytes}`)
    }
    compareCallRows(a.byCall, b.byCall, `${what} ${name}`)
  }
}

export function verifyCountersBundle(dir, meta) {
  const spanPhases = readPhases(path.join(dir, 'span-phases.json'), 'span')
  if (!checkReconciled(spanPhases.phases).ok) throw new Error('counters span-phases.json does not reconcile')
  comparePhaseTables(spanPhases.phases, meta.spanPhases.phases, 'span phases.json vs meta')
  const censusPhases = readPhases(path.join(dir, 'census-phases.json'), 'census')
  if (!checkReconciled(censusPhases.phases).ok) throw new Error('counters census-phases.json does not reconcile')
  comparePhaseTables(censusPhases.phases, meta.censusPhases.phases, 'census phases.json vs meta')
  const census = readCensus(path.join(dir, 'census.json'), 'census')
  const log = readCensusEvents(path.join(dir, 'census-events.json'), 'census')
  const bucketed = bucketCensusEvents(log, phaseWindows(censusPhases))
  checkEventsAgainstCensus(log, bucketed, census)
  compareCensusBuckets(bucketed.phases, meta.censusPhases.byPhase, 'census byPhase')
  compareCensusBuckets(bucketed.unplaced, meta.censusPhases.unplaced, 'census unplaced')
  if (log.count !== meta.censusPhases.events.count) {
    throw new Error(`census event count not reproduced: raw ${log.count} vs filed ${meta.censusPhases.events.count}`)
  }
  return { spanPhases: spanPhases.phases, censusPhases: censusPhases.phases, bucketed }
}

export function verifyAllocBundle(dir, meta) {
  const gcPhases = readPhases(path.join(dir, 'gc-phases.json'), 'gc')
  if (!checkReconciled(gcPhases.phases).ok) throw new Error('alloc gc-phases.json does not reconcile')
  comparePhaseTables(gcPhases.phases, meta.gcPhases.phases, 'gc phases.json vs meta')
  const tracePhases = readPhases(path.join(dir, 'trace-phases.json'), 'trace')
  if (!checkReconciled(tracePhases.phases).ok) throw new Error('alloc trace-phases.json does not reconcile')
  comparePhaseTables(tracePhases.phases, meta.tracePhases.phases, 'trace phases.json vs meta')
  return { gcPhases: gcPhases.phases, tracePhases: tracePhases.phases }
}
