/**
 * Reconciled-decomposition joiner behind `pnpm agentrs decompose` (procedure
 * agentrs-phases/1). It takes three filed bundles — flame (/3+), counters
 * (/2+), alloc (/2+) — and emits the reconciled per-phase sync decomposition
 * that replaces recon §2's mixed windows. Every leg's filed numbers are
 * re-derived from the bundle's own raw files (profile, event log, phases
 * dumps) before joining, so the join verifies as it reads and refuses stale
 * or unreconciled inputs. The flame run is canonical (shipped binary, whole
 * worker); the other four runs corroborate per phase.
 */

import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { renderDecompositionMarkdown } from './decompose-render.mjs'
import { verifyAllocBundle, verifyCountersBundle, verifyFlameBundle } from './decompose-verify.mjs'
import { SYNC_PARTS } from './phases.mjs'

const DECOMPOSE_PROCEDURE = 'agentrs-phases/1'
const MIN_VERSIONS = { flame: 3, counters: 2, alloc: 2 }
const PHASE_NAMES = ['startup', ...SYNC_PARTS, 'workerTail', 'syncTotal', 'workerTotal']

const USAGE = [
  'usage: pnpm agentrs decompose --flame <dir> --counters <dir> --alloc <dir> [--out dir]',
  'example: pnpm agentrs decompose --flame /tmp/flame-small --counters /tmp/counters-small --alloc /tmp/alloc-small',
].join('\n')

function usageError(message) {
  const err = new Error(`${message}\n${USAGE}`)
  err.code = 'DECOMPOSE_USAGE'
  return err
}

function applyDecomposeFlag(options, arg, value) {
  if (arg === '--flame') options.flame = value
  else if (arg === '--counters') options.counters = value
  else if (arg === '--alloc') options.alloc = value
  else if (arg === '--out') options.outDir = value
  else throw usageError(`unknown flag: ${arg}`)
}

export function parseDecomposeArgs(argv) {
  const options = { flame: null, counters: null, alloc: null, outDir: null }
  const words = argv.filter((arg) => arg !== '--')
  if (words.includes('--help') || words.includes('-h')) return { ...options, help: true }
  for (let i = 0; i < words.length; i += 1) {
    const value = words[i + 1]
    if (!value || value.startsWith('-')) throw usageError(`${words[i]} needs a value`)
    applyDecomposeFlag(options, words[i], value)
    i += 1
  }
  if (!options.flame || !options.counters || !options.alloc) {
    throw usageError('--flame, --counters, and --alloc are all required')
  }
  return options
}

function loadMeta(dir, name) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(path.join(dir, 'meta.json'), 'utf-8'))
  } catch {
    throw new Error(`${name} bundle has no readable meta.json: ${dir}`)
  }
  if (!parsed || !parsed.procedure || !parsed.scale || !parsed.plan || !parsed.generated) {
    throw new Error(`${name} bundle meta at ${dir} is missing procedure/scale/plan/generated`)
  }
  return parsed
}

function procedureVersion(procedure) {
  const parts = String(procedure).split('/')
  const version = Number(parts[parts.length - 1])
  return Number.isInteger(version) ? version : null
}

function checkBundleVersion(name, meta) {
  const version = procedureVersion(meta.procedure)
  if (version === null || version < MIN_VERSIONS[name]) {
    throw new Error(`${name} bundle runs ${meta.procedure} — decompose needs same-run phases (re-run at agentrs-${name}/${MIN_VERSIONS[name]} or newer)`)
  }
}

function loadFingerprint(meta) {
  const generated = meta.generated
  return [meta.scale, meta.plan.seed, generated.styleFiles, generated.deadFiles, generated.cssCalls, generated.recipes].join('|')
}

function checkLoadMatch(metas) {
  const prints = {
    flame: loadFingerprint(metas.flame),
    counters: loadFingerprint(metas.counters),
    alloc: loadFingerprint(metas.alloc),
  }
  if (new Set(Object.values(prints)).size !== 1) {
    throw new Error(`bundles disagree on locked load: ${JSON.stringify(prints)}`)
  }
}

function phasesField(meta, field, bundle, leg) {
  const section = meta[field]
  if (!section || !section.phases || !section.reconcile) {
    throw new Error(`${bundle} bundle ${leg} leg files no phases section — stale bundle, re-run the leg`)
  }
  return section
}

function checkReconcileAll(metas) {
  const legs = [
    ['flame', metas.flame.phases.reconcile],
    ['span', metas.counters.spanPhases.reconcile],
    ['census', metas.counters.censusPhases.reconcile],
    ['gc', metas.alloc.gcPhases.reconcile],
    ['trace', metas.alloc.tracePhases.reconcile],
  ]
  for (const [name, verdict] of legs) {
    if (!verdict || !verdict.ok) throw new Error(`${name} leg filed UNRECONCILED phases — refusing to join; re-run the leg`)
  }
  let worst = 0
  for (const [, verdict] of legs) {
    worst = Math.max(worst, Math.abs(verdict.syncDeltaMs), Math.abs(verdict.workerDeltaMs))
  }
  return worst
}

function topCallName(bucket) {
  if (!bucket) return '—'
  let top = '—'
  let best = 0
  for (const [name, row] of Object.entries(bucket.byCall)) {
    if (row.totalNs > best) {
      best = row.totalNs
      top = name
    }
  }
  return top
}

function flameRowFor(buckets, name) {
  return buckets.rows.find((row) => row.name === name) ?? { weight: 0, topLib: '—', topLibWeight: 0 }
}

function joinPhase(name, runs, flame, census) {
  const vals = { flame: runs.flame[name], span: runs.span[name], census: runs.census[name], gc: runs.gc[name], trace: runs.trace[name] }
  const nums = Object.values(vals).filter((value) => typeof value === 'number')
  const flameRow = flameRowFor(flame.buckets, name)
  const censusBucket = census.bucketed.phases[name]
  return {
    runs: vals,
    spread: nums.length === 5 ? Math.max(...nums) - Math.min(...nums) : null,
    flameWeight: flameRow.weight,
    topLib: flameRow.topLib,
    topLibWeight: flameRow.topLibWeight,
    censusCalls: censusBucket ? censusBucket.count : 0,
    censusMs: censusBucket ? censusBucket.totalNs / 1e6 : 0,
    topCall: topCallName(censusBucket),
  }
}

function gcVerdictLine(window) {
  const text = `${window.inWindowFull} in-window full GCs (${window.headFull} head, ${window.tailFull} tail, ${window.edgeFull} edge)`
  if (window.edgeFull > 0) return `AMBIGUOUS — ${text}; re-run before citing`
  if (window.inWindowFull > 0) return `FAIL — ${text}`
  return `PASS — ${text}`
}

function joinDecomposition(metas, verified) {
  const runs = {
    flame: verified.flame.phases,
    span: verified.counters.spanPhases,
    census: verified.counters.censusPhases,
    gc: verified.alloc.gcPhases,
    trace: verified.alloc.tracePhases,
  }
  const phases = {}
  for (const name of PHASE_NAMES) phases[name] = joinPhase(name, runs, verified.flame, verified.counters)
  const unplaced = verified.counters.bucketed.unplaced
  return {
    scale: metas.flame.scale,
    load: { plan: metas.flame.plan, generated: metas.flame.generated },
    canonical: 'flame',
    sources: {
      flame: { procedure: metas.flame.procedure, createdAt: metas.flame.createdAt },
      counters: { procedure: metas.counters.procedure, createdAt: metas.counters.createdAt },
      alloc: { procedure: metas.alloc.procedure, createdAt: metas.alloc.createdAt },
    },
    phases,
    unplaced: {
      flamePreMain: verified.flame.buckets.preMain,
      flamePostWorker: verified.flame.buckets.postWorker,
      censusPreMain: unplaced.preMain ? unplaced.preMain.count : 0,
      censusPreMainMs: unplaced.preMain ? unplaced.preMain.totalNs / 1e6 : 0,
      censusPostWorker: unplaced.postWorker ? unplaced.postWorker.count : 0,
      censusPostWorkerMs: unplaced.postWorker ? unplaced.postWorker.totalNs / 1e6 : 0,
    },
    compile: {
      compileMsCanonical: runs.flame.compile,
      spanWallMs: metas.counters.spanLeg.spanWallMs,
      allocWallMs: metas.alloc.traceLeg.rustSpan.wallMs,
      marshalDeltaSpan: metas.counters.spanPhases.compileVsSpanMs.delta,
      marshalDeltaAlloc: metas.alloc.tracePhases.compileVsSpanMs.delta,
      instructions: metas.counters.derived.instructions,
      ipc: metas.counters.derived.ipc,
      allocBytes: metas.alloc.traceLeg.rustSpan.allocBytes,
      reallocs: metas.alloc.traceLeg.rustSpan.reallocs,
      peakLive: metas.alloc.traceLeg.rustSpan.peakLive,
      gcVerdict: gcVerdictLine(metas.alloc.traceLeg.window),
    },
  }
}

function shortProcedure(procedure) {
  return String(procedure).replace(/^agentrs-/, '')
}

function decomposeProcedureNote(metas) {
  const legs = [metas.flame.procedure, metas.counters.procedure, metas.alloc.procedure]
    .map(shortProcedure)
    .join(' + ')
  return `reconciled same-run decomposition joining ${legs} bundles; filed numbers re-derived from bundle raws before joining`
}

function buildChecks(metas, verified, worstDelta) {
  const generated = metas.flame.generated
  const eventCount = metas.counters.censusPhases.events.count
  const phaseCount = Object.keys(verified.counters.bucketed.phases).length
  return {
    loadMatch: `scale ${metas.flame.scale}, seed ${metas.flame.plan.seed}, ${generated.cssCalls} css() calls identical across all three bundles`,
    reconcile: `5/5 legs RECONCILED (worst phase-sum delta ${worstDelta.toFixed(3)} ms)`,
    flameBuckets: `${verified.flame.buckets.rows.length} rows + pre/post weights exact vs filed meta; weights sum to weightSum ${metas.flame.phases.weightSum}`,
    censusBuckets: `${eventCount} events across ${phaseCount} phases exact vs filed meta; ${metas.counters.censusPhases.events.dropped} dropped`,
    censusProof: 'event sums equal schema-1 census.json on all 15 calls (count/ns/bytes)',
    allocPhases: 'gc + trace phase tables exact vs filed meta',
  }
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

function relativeDir(repoRoot, dir) {
  return path.relative(repoRoot, path.resolve(dir)) || dir
}

function writeDecomposeEvidence(evidenceDir, repoRoot, options, metas, decomp) {
  mkdirSync(evidenceDir, { recursive: true })
  for (const name of ['flame', 'counters', 'alloc']) {
    decomp.sources[name].dir = relativeDir(repoRoot, options[name])
  }
  const workerSamples = {
    flame: metas.flame.worker.syncMs,
    span: metas.counters.spanLeg.sample.syncMs,
    census: metas.counters.censusLeg.sample.syncMs,
    gc: metas.alloc.gcLeg.sample.syncMs,
    trace: metas.alloc.traceLeg.sample.syncMs,
  }
  const meta = {
    procedure: DECOMPOSE_PROCEDURE,
    procedureNote: decomposeProcedureNote(metas),
    scale: decomp.scale,
    pin: decomp.pin,
    plan: decomp.load.plan,
    generated: decomp.load.generated,
    sources: decomp.sources,
    workerSamples,
    checks: decomp.checks,
    createdAt: new Date().toISOString(),
    treeStatus: gitStatusExcerpt(repoRoot),
  }
  writeFileSync(path.join(evidenceDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
  writeFileSync(path.join(evidenceDir, 'decomposition.json'), `${JSON.stringify(decomp, null, 2)}\n`)
  writeFileSync(path.join(evidenceDir, 'decomposition.md'), renderDecompositionMarkdown(decomp))
  return { meta, dir: evidenceDir }
}

function printDecomposeReport(evidenceDir, decomp) {
  const c = decomp.phases
  console.log(`\n[agent-rs] decompose evidence: ${evidenceDir}`)
  console.log(`  sync ≈ ${c.syncTotal.runs.flame.toFixed(1)} ms = config ${c.config.runs.flame.toFixed(1)} + scan ${c.scan.runs.flame.toFixed(1)} + evaluate ${c.evaluate.runs.flame.toFixed(1)} + compile ${c.compile.runs.flame.toFixed(1)} + publish ${c.publish.runs.flame.toFixed(1)} (+ residual ${c.syncResidual.runs.flame.toFixed(1)})`)
  console.log(`  startup ${c.startup.runs.flame.toFixed(1)} ms outside sync; ${decomp.checks.reconcile}`)
  console.log('')
}

function benchModuleUrl(benchDir, rel) {
  return pathToFileURL(path.join(benchDir, rel)).href
}

export async function runDecomposeCommand(args, repoRoot) {
  let options
  try {
    options = parseDecomposeArgs(args)
  } catch (err) {
    console.error(`[agent-rs] ${err.message}`)
    return 1
  }
  if (options.help) {
    console.log(USAGE)
    return 0
  }
  const benchDir = path.join(repoRoot, 'packages', 'reference-neo', 'benchmark')
  try {
    const metas = {
      flame: loadMeta(options.flame, 'flame'),
      counters: loadMeta(options.counters, 'counters'),
      alloc: loadMeta(options.alloc, 'alloc'),
    }
    checkBundleVersion('flame', metas.flame)
    checkBundleVersion('counters', metas.counters)
    checkBundleVersion('alloc', metas.alloc)
    phasesField(metas.flame, 'phases', 'flame', 'worker')
    phasesField(metas.counters, 'spanPhases', 'counters', 'span')
    phasesField(metas.counters, 'censusPhases', 'counters', 'census')
    phasesField(metas.alloc, 'gcPhases', 'alloc', 'gc')
    phasesField(metas.alloc, 'tracePhases', 'alloc', 'trace')
    checkLoadMatch(metas)
    const worstDelta = checkReconcileAll(metas)
    const verified = {
      flame: verifyFlameBundle(options.flame, metas.flame),
      counters: verifyCountersBundle(options.counters, metas.counters),
      alloc: verifyAllocBundle(options.alloc, metas.alloc),
    }
    const decomp = joinDecomposition(metas, verified)
    decomp.checks = buildChecks(metas, verified, worstDelta)
    const pinModule = await import(benchModuleUrl(benchDir, 'report/pin.ts'))
    decomp.pin = pinModule.resolvePin(benchDir)
    const evidenceDir = options.outDir
      ? path.resolve(options.outDir)
      : path.join(repoRoot, 'docs', 'evidence', 'phases', `${decomp.scale}-${decomp.pin.name}`)
    writeDecomposeEvidence(evidenceDir, repoRoot, options, metas, decomp)
    printDecomposeReport(evidenceDir, decomp)
  } catch (err) {
    console.error(`[agent-rs] decompose failed: ${err instanceof Error ? err.message : String(err)}`)
    return 1
  }
  return 0
}
