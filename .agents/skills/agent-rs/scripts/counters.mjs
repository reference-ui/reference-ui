/**
 * Hardware-counters harness behind `pnpm agentrs counters`.
 *
 * It takes a frozen bench scale and emits a counters pass over one frozen
 * repo: a span leg (the release+counters-trace instrument build dumping the
 * exact-window Mach/rusage snapshot pair around the blocking compile) plus a
 * census leg (the shipped release `.node` under a DYLD interpose shim counting
 * libc file calls, with a bare-node startup baseline for subtraction). The
 * bench generator and worker run verbatim on every leg; evidence lands under
 * docs/evidence/counters/ as meta, raw dumps, the net census, and summary.
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { withCpuGate } from '../../test-core/scripts/cpu-gate.mjs'
import { describeShippedNative, ensureCountersNative, describeCountersNative } from './alloc-build.mjs'
import { CENSUS_EVENTS_OUT_ENV, CENSUS_OUT_ENV, bucketCensusEvents, buildCountersShim, checkEventsAgainstCensus, readCensus, readCensusEvents, runShimmed, subtractCensus } from './counters-census.mjs'
import { buildCountersMeta, resolveCountersEvidenceDir } from './counters-evidence.mjs'
import { writeCountersEvidence } from './counters-summary.mjs'
import { PHASES_OUT_ENV, phaseWindows, phasesEnvFor, readPhases } from './phases.mjs'

const COUNTERS_PROCEDURE = 'agentrs-counters/2'
const COUNTERS_PROCEDURE_NOTE = 'same-run phase boundaries on span + census legs; timestamped libc event log bucketed into phases (v1 had whole-worker census minus a bare-node baseline, span from another run)'
const DEFAULT_SCALE = 'enterprise'
const WORKER_SAMPLE_MS = 10
const TRACE_OUT_ENV = 'COUNTERS_TRACE_OUT'
const NATIVE_PATH_ENV = 'REFERENCE_UI_NATIVE_PATH'
const SHIM_ENV = 'DYLD_INSERT_LIBRARIES'

const USAGE = [
  'usage: pnpm agentrs counters [-- scale] [--out dir] [--keep] [--no-build]',
  '       pnpm agentrs counters --list   (frozen bench scales; enterprise is the default)',
  'example: pnpm agentrs counters -- enterprise',
].join('\n')

function usageError(message) {
  const err = new Error(`${message}\n${USAGE}`)
  err.code = 'COUNTERS_USAGE'
  return err
}

function applyValuedFlag(options, words, index) {
  if (words[index] !== '--out') return null
  const value = words[index + 1]
  if (!value) throw usageError('--out needs a value')
  options.outDir = value
  return index + 2
}

function applyToggleFlag(options, arg) {
  if (arg === '--keep') options.keep = true
  else if (arg === '--no-build') options.noBuild = true
  else return false
  return true
}

function consumeCountersWord(options, words, index, positional) {
  const arg = words[index]
  const valued = applyValuedFlag(options, words, index)
  if (valued !== null) return { next: valued, positional }
  if (applyToggleFlag(options, arg)) return { next: index + 1, positional }
  if (arg.startsWith('-')) throw usageError(`unknown flag: ${arg}`)
  if (positional) throw usageError(`one scale only, got: ${positional} and ${arg}`)
  return { next: index + 1, positional: arg }
}

export function parseCountersArgs(argv) {
  const options = { scale: DEFAULT_SCALE, outDir: null, keep: false, noBuild: false }
  const words = argv.filter((arg) => arg !== '--')
  if (words.includes('--list')) return { ...options, list: true }
  if (words.includes('--help') || words.includes('-h')) return { ...options, help: true }
  let positional = null
  let index = 0
  while (index < words.length) {
    const step = consumeCountersWord(options, words, index, positional)
    positional = step.positional
    index = step.next
  }
  if (positional) options.scale = positional
  return options
}

export function printCountersHelp() {
  console.log(USAGE)
}

function benchModuleUrl(benchDir, rel) {
  return pathToFileURL(path.join(benchDir, rel)).href
}

function parseWorkerSample(stdout, leg) {
  const lines = stdout.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('{'))
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      const parsed = JSON.parse(lines[i])
      if (parsed && typeof parsed.syncMs === 'number') return parsed
    } catch {}
  }
  throw new Error(`bench worker printed no sample JSON on the ${leg} leg`)
}

async function generateCountersRepo(ctx) {
  const plans = await import(benchModuleUrl(ctx.benchDir, 'generate/plans.ts'))
  const generators = await import(benchModuleUrl(ctx.benchDir, 'generate/generators/index.ts'))
  const plan = plans.resolvePlan(ctx.options.scale, {})
  const dir = mkdtempSync(path.join(tmpdir(), 'neo-counters-'))
  const generated = generators.generateRepo(plan, dir)
  console.log(`[agent-rs] counters repo: ${generated.styleFiles} files, ${generated.cssCalls} css() calls, seed ${plan.seed}`)
  return { dir, plan, generated }
}

function cleanEnv() {
  const env = { ...process.env }
  delete env[NATIVE_PATH_ENV]
  delete env[TRACE_OUT_ENV]
  delete env[SHIM_ENV]
  delete env[CENSUS_OUT_ENV]
  delete env[CENSUS_EVENTS_OUT_ENV]
  delete env[PHASES_OUT_ENV]
  return env
}

function workerInvocation(benchDir, repoDir) {
  const workerPath = path.join(benchDir, 'measure/worker.ts')
  return { workerPath, args: [workerPath, repoDir, String(WORKER_SAMPLE_MS)] }
}

function readSpanDump(spanPath) {
  let parsed
  try {
    parsed = JSON.parse(readFileSync(spanPath, 'utf-8'))
  } catch {
    throw new Error(`span leg wrote no dump at ${spanPath} — the worker did not load the counters binary`)
  }
  if (!parsed || parsed.schema !== 1 || !parsed.span || !parsed.span.before || !parsed.span.after) {
    throw new Error(`span leg dump at ${spanPath} has an unexpected shape`)
  }
  return parsed
}

async function runSpanLeg(ctx, repo, evidenceDir, countersBinary) {
  mkdirSync(evidenceDir, { recursive: true })
  const spanPath = path.join(evidenceDir, 'counters-span.json')
  const phasesEnv = phasesEnvFor(evidenceDir, 'span-phases.json')
  const { args } = workerInvocation(ctx.benchDir, repo.dir)
  const env = { ...cleanEnv(), [NATIVE_PATH_ENV]: countersBinary, [TRACE_OUT_ENV]: spanPath, ...phasesEnv }
  console.log('[agent-rs] counters span leg: <bench worker> (release+counters-trace .node)')
  const result = await runShimmed(process.execPath, args, env)
  if (result.code !== 0) throw new Error(`span leg failed (code ${result.code})${result.error ? `: ${result.error}` : ''}`)
  return {
    sample: parseWorkerSample(result.stdout, 'span'),
    nodeArgs: [],
    command: [process.execPath, ...args],
    env: { [NATIVE_PATH_ENV]: countersBinary, [TRACE_OUT_ENV]: spanPath, ...phasesEnv },
    span: readSpanDump(spanPath),
    phases: readPhases(phasesEnv.REFERENCE_UI_PHASES_OUT, 'span'),
  }
}

function bucketCensusRun(censusPath, eventsPath, phases) {
  const census = readCensus(censusPath, 'census')
  const log = readCensusEvents(eventsPath, 'census')
  const bucketed = bucketCensusEvents(log, phaseWindows(phases))
  checkEventsAgainstCensus(log, bucketed, census)
  return { census, events: { file: 'census-events.json', count: log.count, dropped: log.dropped ?? 0 }, bucketed }
}

async function runCensusLeg(ctx, repo, evidenceDir, shim) {
  const censusPath = path.join(evidenceDir, 'census.json')
  const eventsPath = path.join(evidenceDir, 'census-events.json')
  const phasesEnv = phasesEnvFor(evidenceDir, 'census-phases.json')
  const { args } = workerInvocation(ctx.benchDir, repo.dir)
  const env = { ...cleanEnv(), [SHIM_ENV]: shim.dylib, [CENSUS_OUT_ENV]: censusPath, [CENSUS_EVENTS_OUT_ENV]: eventsPath, ...phasesEnv }
  console.log('[agent-rs] counters census leg: <bench worker> (shipped .node + interpose shim)')
  const result = await runShimmed(process.execPath, args, env)
  if (result.code !== 0) throw new Error(`census leg failed (code ${result.code})${result.error ? `: ${result.error}` : ''}`)
  const phases = readPhases(phasesEnv.REFERENCE_UI_PHASES_OUT, 'census')
  const bucketed = bucketCensusRun(censusPath, eventsPath, phases)
  return {
    sample: parseWorkerSample(result.stdout, 'census'),
    nodeArgs: [],
    command: [process.execPath, ...args],
    env: { [SHIM_ENV]: shim.dylib, [CENSUS_OUT_ENV]: censusPath, [CENSUS_EVENTS_OUT_ENV]: eventsPath, ...phasesEnv },
    census: bucketed.census,
    events: bucketed.events,
    bucketed: bucketed.bucketed,
    phases,
  }
}

async function runStartupBaseline(evidenceDir, shim) {
  const censusPath = path.join(evidenceDir, 'census-startup.json')
  const env = { ...cleanEnv(), [SHIM_ENV]: shim.dylib, [CENSUS_OUT_ENV]: censusPath }
  console.log('[agent-rs] counters startup baseline: node -e (shim only)')
  const result = await runShimmed(process.execPath, ['-e', ''], env)
  if (result.code !== 0) throw new Error(`startup baseline failed (code ${result.code})${result.error ? `: ${result.error}` : ''}`)
  return { census: readCensus(censusPath, 'startup baseline') }
}

function cleanupRepo(repo, keep) {
  if (keep) {
    console.log(`[agent-rs] counters repo kept at ${repo.dir}`)
    return
  }
  rmSync(repo.dir, { recursive: true, force: true })
}

function netCallKey(net, name, key) {
  const row = net[name]
  if (!row) return 0
  return typeof row[key] === 'number' ? row[key] : 0
}

function netCallCount(net, name) {
  return netCallKey(net, name, 'count')
}

function netCallBytes(net, name) {
  return netCallKey(net, name, 'bytes')
}

function reportCell(value) {
  if (value === null || value === undefined) return 'n/a'
  return typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : String(value)
}

function printCountersReport(evidenceDir, meta) {
  console.log(`\n[agent-rs] counters evidence: ${evidenceDir}`)
  console.log(`  span leg: ${meta.spanLeg.spanWallMs.toFixed(1)} ms blocking call, rss peak ${(meta.spanLeg.sample.rssPeak / 1048576).toFixed(0)} MiB`)
  console.log(`  census leg: ${meta.censusLeg.sample.syncMs.toFixed(1)} ms sync (unscored: shim overhead applies)`)
  const net = meta.censusNet.calls
  const opens = netCallCount(net, 'open') + netCallCount(net, 'openat')
  const reads = netCallCount(net, 'read') + netCallCount(net, 'pread') + netCallCount(net, 'readv')
  const readBytes = netCallBytes(net, 'read') + netCallBytes(net, 'pread') + netCallBytes(net, 'readv')
  console.log(`  net opens: ${opens}, net reads: ${reads} (${readBytes} bytes)`)
  const events = meta.derived.events ?? {}
  console.log(`  span: ${reportCell(meta.derived.instructions)} instr, IPC ${reportCell(meta.derived.ipc)}, ${reportCell(events.syscallsUnix)} unix syscalls`)
  if (meta.spanPhases?.reconcile) {
    console.log(`  phases: compile ${meta.spanPhases.phases.compile.toFixed(1)} ms vs span ${meta.spanLeg.spanWallMs.toFixed(1)} ms (${meta.spanPhases.reconcile.ok ? 'RECONCILED' : 'UNRECONCILED'})`)
  }
  console.log('')
}

async function captureCounters(ctx, evidenceDir, natives) {
  const repo = await generateCountersRepo(ctx)
  try {
    const spanLeg = await runSpanLeg(ctx, repo, evidenceDir, natives.countersBinary)
    const shim = buildCountersShim()
    try {
      const censusLeg = await runCensusLeg(ctx, repo, evidenceDir, shim)
      const startup = await runStartupBaseline(evidenceDir, shim)
      const legs = { span: spanLeg, census: censusLeg, startup }
      const meta = buildCountersMeta({ ...ctx, procedure: COUNTERS_PROCEDURE, procedureNote: COUNTERS_PROCEDURE_NOTE }, repo, legs, {
        shipped: natives.shipped,
        counters: describeCountersNative(ctx.rsDir, natives.countersBinary, natives.inputsHash),
        shim,
      })
      writeCountersEvidence(evidenceDir, meta)
      printCountersReport(evidenceDir, meta)
    } finally {
      rmSync(shim.dir, { recursive: true, force: true })
    }
  } finally {
    cleanupRepo(repo, ctx.options.keep)
  }
}

export async function listCountersScales(benchDir) {
  const plans = await import(benchModuleUrl(benchDir, 'generate/plans.ts'))
  for (const plan of plans.listProfiles()) {
    console.log(`${plan.scale} [${plan.generator}]: ${plan.files} files, seed ${plan.seed}`)
  }
}

export async function runCountersCommand(args, repoRoot, rsDir) {
  let options
  try {
    options = parseCountersArgs(args)
  } catch (err) {
    console.error(`[agent-rs] ${err.message}`)
    return 1
  }
  const benchDir = path.join(repoRoot, 'packages', 'reference-neo', 'benchmark')
  if (options.help) {
    printCountersHelp()
    return 0
  }
  if (options.list) {
    await listCountersScales(benchDir)
    return 0
  }
  const pinModule = await import(benchModuleUrl(benchDir, 'report/pin.ts'))
  const pin = pinModule.resolvePin(benchDir)
  const evidenceDir = resolveCountersEvidenceDir(repoRoot, options, pin)
  let shipped
  try {
    shipped = describeShippedNative(rsDir, options.noBuild)
  } catch (err) {
    console.error(`[agent-rs] ${err.message}`)
    return 1
  }
  const ctx = { repoRoot, rsDir, benchDir, options, pin }
  let counters
  try {
    counters = await ensureCountersNative(ctx)
  } catch (err) {
    console.error(`[agent-rs] ${err.message}`)
    return 1
  }
  try {
    await withCpuGate('rs', `agentrs counters ${options.scale}`, () =>
      captureCounters(ctx, evidenceDir, { shipped, countersBinary: counters.binaryPath, inputsHash: counters.inputsHash }),
    )
  } catch (err) {
    console.error(`[agent-rs] counters failed: ${err instanceof Error ? err.message : String(err)}`)
    return 1
  }
  return 0
}
