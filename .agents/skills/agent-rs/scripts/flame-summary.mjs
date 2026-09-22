/**
 * Samply profile summarizer for `pnpm agentrs flame` (procedures agentrs-flame/2+).
 *
 * It takes a recorded Firefox Profiler JSON (.json.gz) plus the presymbolicated
 * sidecar samply emits, and joins raw addresses to symbol names without a
 * browser. It emits the lib histogram and the merged self/inclusive rankings
 * that land in the filed summary.md, so a baseline stays readable from the
 * repo alone. Costs are sample weights grouped by symbolized (resource, name),
 * so same-function addresses merge; inclusive walks the prefix chain and
 * counts each sample once per function, attributing callees to callers.
 * Symbol lookup is closest-preceding RVA, the same rule profilers use, and
 * given the same-run phases file it buckets samples by timestamp into phases
 * so per-phase wall carries its own sampled cross-check.
 */

import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { SYNC_PARTS, bucketize, checkFlameAlignment, checkReconciled, phaseWindows, renderReconcileLine, sampleWeightOf } from './phases.mjs'

export function indexSidecar(sidecar) {
  for (const lib of sidecar.data) lib.symbol_table.sort((a, b) => a.rva - b.rva)
  const tables = new Map()
  for (const lib of sidecar.data) {
    tables.set(`${lib.debug_name}|${lib.code_id}`, lib.symbol_table)
  }
  return { tables, strings: sidecar.string_table }
}

export function loadProfile(profilePath) {
  const raw = readFileSync(profilePath)
  const text = profilePath.endsWith('.gz') ? gunzipSync(raw).toString('utf-8') : raw.toString('utf-8')
  return JSON.parse(text)
}

function lookupSymbol(index, key, address) {
  const entries = index.tables.get(key)
  if (!entries) return null
  let low = 0
  let high = entries.length - 1
  let best = -1
  while (low <= high) {
    const mid = (low + high) >> 1
    if (entries[mid].rva <= address) {
      best = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  if (best < 0) return null
  return index.strings[entries[best].symbol] ?? null
}

function sampleWeight(thread, sample) {
  return thread.samples.weight?.[sample] ?? 1
}

function sumWeights(thread) {
  let total = 0
  for (let i = 0; i < thread.samples.length; i += 1) total += sampleWeight(thread, i)
  return total
}

function libEntryOf(scan, resource) {
  const index = scan.thread.resourceTable.lib[resource]
  if (typeof index !== 'number' || !scan.libs[index]) return null
  return scan.libs[index]
}

function resolveName(scan, func, address) {
  const raw = scan.thread.stringArray[scan.thread.funcTable.name[func]] ?? 'unknown'
  if (!raw.startsWith('0x')) return raw
  const lib = libEntryOf(scan, scan.thread.funcTable.resource[func])
  if (!lib) return raw
  return lookupSymbol(scan.index, `${lib.debugName}|${lib.codeId}`, address) ?? raw
}

function scanFrames(scan) {
  const { thread } = scan
  const rows = new Array(thread.frameTable.length)
  for (let frame = 0; frame < rows.length; frame += 1) {
    const func = thread.frameTable.func[frame]
    const resource = thread.funcTable.resource[func]
    const name = resolveName(scan, func, thread.frameTable.address[frame])
    const lib = libEntryOf(scan, resource)
    rows[frame] = {
      key: JSON.stringify([resource, name]),
      libName: lib ? lib.name : '(unmapped jit)',
      name,
      samples: 0,
      inclusive: 0,
    }
  }
  return rows
}

function freshCost(row) {
  return { libName: row.libName, name: row.name, samples: 0, inclusive: 0 }
}

function collectSelfCosts(scan, frames) {
  const { thread } = scan
  const costs = new Map()
  for (let i = 0; i < thread.samples.length; i += 1) {
    const stack = thread.samples.stack[i]
    if (stack === null || stack === undefined) continue
    const row = frames[thread.stackTable.frame[stack]]
    let hit = costs.get(row.key)
    if (!hit) {
      hit = freshCost(row)
      costs.set(row.key, hit)
    }
    hit.samples += sampleWeight(thread, i)
  }
  return costs
}

function attributeInclusiveSample(scan, frames, costs, sample) {
  const { thread } = scan
  const weight = sampleWeight(thread, sample)
  const seen = new Set()
  let stack = thread.samples.stack[sample]
  while (stack !== null && stack !== undefined) {
    const row = frames[thread.stackTable.frame[stack]]
    if (!seen.has(row.key)) {
      seen.add(row.key)
      let hit = costs.get(row.key)
      if (!hit) {
        hit = freshCost(row)
        costs.set(row.key, hit)
      }
      hit.inclusive += weight
    }
    stack = thread.stackTable.prefix[stack]
  }
}

function collectInclusiveCosts(scan, frames, costs) {
  for (let i = 0; i < scan.thread.samples.length; i += 1) {
    attributeInclusiveSample(scan, frames, costs, i)
  }
  return costs
}

function compareNames(a, b) {
  if (a.name === b.name) return a.libName < b.libName ? -1 : 1
  return a.name < b.name ? -1 : 1
}

function rankCosts(costs, pick) {
  return [...costs.values()].sort((a, b) => pick(b) - pick(a) || compareNames(a, b))
}

function rankLibs(costs) {
  const counts = new Map()
  for (const hit of costs.values()) {
    if (hit.samples === 0) continue
    const entry = counts.get(hit.libName) ?? { name: hit.libName, samples: 0 }
    entry.samples += hit.samples
    counts.set(hit.libName, entry)
  }
  return [...counts.values()].sort((a, b) => b.samples - a.samples)
}

function mainThread(profile) {
  return profile.threads.find((entry) => entry.isMainThread) ?? profile.threads[0]
}

export function profileTotals(profile) {
  const thread = mainThread(profile)
  return { sampleCount: thread.samples.length, weightSum: sumWeights(thread) }
}

export function buildScan(profile, index) {
  const thread = mainThread(profile)
  const scan = { thread, libs: profile.libs, index }
  return { thread, frames: scanFrames(scan) }
}

export function summarizeProfile(profile, index) {
  const { thread, frames } = buildScan(profile, index)
  const scan = { thread, libs: profile.libs, index }
  const costs = collectInclusiveCosts(scan, frames, collectSelfCosts(scan, frames))
  const bySelf = rankCosts(costs, (hit) => hit.samples)
  const byInclusive = rankCosts(costs, (hit) => hit.inclusive)
  const native = (rows) => rows.filter((hit) => hit.libName.endsWith('.node'))
  return {
    threadName: thread.name,
    sampleCount: thread.samples.length,
    weightSum: sumWeights(thread),
    weightType: thread.samples.weightType ?? 'samples',
    libs: rankLibs(costs).slice(0, 12),
    top: bySelf.slice(0, 25),
    nativeTop: native(bySelf).slice(0, 20),
    inclusiveTop: byInclusive.slice(0, 25),
    nativeInclusiveTop: native(byInclusive).slice(0, 20),
  }
}

function freshBucket() {
  return { weight: 0, libs: new Map() }
}

function bucketOf(buckets, phase) {
  let bucket = buckets.get(phase)
  if (!bucket) {
    bucket = freshBucket()
    buckets.set(phase, bucket)
  }
  return bucket
}

function attributePhaseLeaf(bucket, thread, frames, sample) {
  const stack = thread.samples.stack[sample]
  if (stack === null || stack === undefined) return
  const leaf = frames[thread.stackTable.frame[stack]]
  bucket.libs.set(leaf.libName, (bucket.libs.get(leaf.libName) ?? 0) + sampleWeightOf(thread, sample))
}

function attributePhaseSample(ctx, sample) {
  const phase = bucketize(ctx.times[sample], ctx.windows)
  if (phase === 'preMain') {
    ctx.preMain += sampleWeightOf(ctx.thread, sample)
    return
  }
  if (phase === 'postWorker') {
    ctx.postWorker += sampleWeightOf(ctx.thread, sample)
    return
  }
  const bucket = bucketOf(ctx.buckets, phase)
  bucket.weight += sampleWeightOf(ctx.thread, sample)
  attributePhaseLeaf(bucket, ctx.thread, ctx.frames, sample)
}

function topLibOf(bucket) {
  let top = { name: '—', weight: 0 }
  for (const [name, weight] of bucket.libs) {
    if (weight > top.weight) top = { name, weight }
  }
  return top
}

function bucketRows(buckets, phases) {
  const rows = []
  for (const name of ['startup', ...SYNC_PARTS, 'workerTail']) {
    const bucket = buckets.get(name)
    const top = bucket ? topLibOf(bucket) : { name: '—', weight: 0 }
    rows.push({
      name,
      ms: phases[name] ?? null,
      weight: bucket?.weight ?? 0,
      topLib: top.name,
      topLibWeight: top.weight,
    })
  }
  return rows
}

// Per-phase sample buckets over the same-run phases file. Throws on clock
// misalignment: bucketing unaligned samples would file confident garbage.
export function summarizePhaseBuckets(profile, index, phases) {
  const alignment = checkFlameAlignment(profile, phases)
  if (!alignment.ok) throw new Error(`flame phases unaligned: ${alignment.reason}`)
  const { thread, frames } = buildScan(profile, index)
  const ctx = {
    thread,
    frames,
    times: alignment.times,
    windows: phaseWindows(phases),
    buckets: new Map(),
    preMain: 0,
    postWorker: 0,
  }
  for (let i = 0; i < thread.samples.length; i += 1) attributePhaseSample(ctx, i)
  return {
    rows: bucketRows(ctx.buckets, phases.phases),
    preMain: ctx.preMain,
    postWorker: ctx.postWorker,
    reconcile: checkReconciled(phases.phases),
    processStartDeltaMs: alignment.processStartDeltaMs,
  }
}

function phaseBucketRow(row) {
  const ms = typeof row.ms === 'number' ? row.ms.toFixed(1) : 'n/a'
  return `| ${row.name} | ${ms} | ${row.weight} | ${row.topLib} (${row.topLibWeight}) |`
}

function pushPhaseSection(lines, buckets) {
  lines.push('', '## Same-run phases (agentrs-phases/1)', '', '| phase | ms | weight | top self lib (weight) |', '| --- | --- | --- | --- |')
  for (const row of buckets.rows) lines.push(phaseBucketRow(row))
  lines.push(`| preMain samples | — | ${buckets.preMain} | — |`)
  lines.push(`| postWorker samples | — | ${buckets.postWorker} | — |`)
  lines.push('', `${renderReconcileLine(buckets.reconcile)} Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.`, `Alignment: processStart ${buckets.processStartDeltaMs.toFixed(1)} ms after profile start.`, '')
}

function frameName(name) {
  return name.length > 120 ? `${name.slice(0, 117)}...` : name
}

function frameRow(frame, total) {
  const selfShare = ((frame.samples / total) * 100).toFixed(1)
  const inclShare = ((frame.inclusive / total) * 100).toFixed(1)
  return `| ${frame.samples} | ${frame.inclusive} | ${selfShare}% | ${inclShare}% | ${frame.libName} | \`${frameName(frame.name)}\` |`
}

function libRow(lib, total) {
  return `| ${lib.samples} | ${((lib.samples / total) * 100).toFixed(1)}% | ${lib.name} |`
}

function frameTableHeader() {
  return ['| self | incl | self% | incl% | lib | frame |', '| --- | --- | --- | --- | --- | --- |']
}

function pushFrameSection(lines, title, rows, total) {
  lines.push('', `## ${title}`, '', ...frameTableHeader())
  if (rows.length === 0) lines.push('| — | — | — | — | — | no `.node` frames sampled |')
  for (const frame of rows) lines.push(frameRow(frame, total))
}

export function renderSummaryMarkdown(summary, meta) {
  const total = Math.max(1, summary.weightSum)
  const lines = [
    `# Flame summary: ${meta.scale} (${meta.pinName})`,
    '',
  ]
  if (meta.procedure) {
    lines.push(`Procedure: \`${meta.procedure}\`${meta.procedureNote ? ` — ${meta.procedureNote}` : ''}`, '')
  }
  lines.push(
    `Samples (main thread): ${summary.sampleCount} samples (weight ${summary.weightSum}) at ${meta.rateHz} Hz.`,
    'Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.',
    'Profile: `profile.json.gz` — view with `samply load profile.json.gz`.',
    '',
    '## Samples by library (self)',
    '',
    '| samples | share | lib |',
    '| --- | --- | --- |',
  )
  for (const lib of summary.libs) lines.push(libRow(lib, total))
  if (summary.buckets) pushPhaseSection(lines, summary.buckets)
  pushFrameSection(lines, 'Top functions by self cost', summary.top, total)
  pushFrameSection(lines, 'Top self functions in the native addon', summary.nativeTop, total)
  pushFrameSection(lines, 'Top functions by inclusive cost', summary.inclusiveTop, total)
  pushFrameSection(lines, 'Top inclusive functions in the native addon', summary.nativeInclusiveTop, total)
  lines.push('')
  return lines.join('\n')
}
