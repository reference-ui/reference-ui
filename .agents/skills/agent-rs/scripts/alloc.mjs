/**
 * Allocation harness behind `pnpm agentrs alloc`.
 *
 * It takes a frozen bench scale and emits an allocation report of the real
 * sync path over one frozen repo: a GC leg (`node --trace-gc` on the shipped
 * release `.node`) re-measuring R1's whole-run census, then a trace leg (the
 * release+alloc-trace instrument build) dumping the Rust compile-span ledger
 * while its own same-process GC log places each full GC against the measured
 * window. Evidence lands under docs/evidence/alloc/ as meta, both GC logs
 * plus censuses, the Rust span dump, and summary. The load stays locked:
 * scale names only, the bench generator and worker run verbatim, dist/native
 * is never touched.
 */

import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { withCpuGate } from '../../test-core/scripts/cpu-gate.mjs'
import { describeShippedNative, describeTraceNative, ensureTraceNative } from './alloc-build.mjs'
import { parseGcLog } from './alloc-gc.mjs'
import { buildAllocMeta, resolveAllocEvidenceDir, writeAllocEvidence } from './alloc-evidence.mjs'

const ALLOC_PROCEDURE = 'agentrs-alloc/1'
const DEFAULT_SCALE = 'enterprise'
const WORKER_SAMPLE_MS = 10
const TRACE_OUT_ENV = 'ALLOC_TRACE_OUT'
const NATIVE_PATH_ENV = 'REFERENCE_UI_NATIVE_PATH'

const USAGE = [
  'usage: pnpm agentrs alloc [-- scale] [--out dir] [--keep] [--no-build]',
  '       pnpm agentrs alloc --list   (frozen bench scales; enterprise is the default)',
  'example: pnpm agentrs alloc -- enterprise',
].join('\n')

function usageError(message) {
  const err = new Error(`${message}\n${USAGE}`)
  err.code = 'ALLOC_USAGE'
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

function consumeAllocWord(options, words, index, positional) {
  const arg = words[index]
  const valued = applyValuedFlag(options, words, index)
  if (valued !== null) return { next: valued, positional }
  if (applyToggleFlag(options, arg)) return { next: index + 1, positional }
  if (arg.startsWith('-')) throw usageError(`unknown flag: ${arg}`)
  if (positional) throw usageError(`one scale only, got: ${positional} and ${arg}`)
  return { next: index + 1, positional: arg }
}

export function parseAllocArgs(argv) {
  const options = { scale: DEFAULT_SCALE, outDir: null, keep: false, noBuild: false }
  const words = argv.filter((arg) => arg !== '--')
  if (words.includes('--list')) return { ...options, list: true }
  if (words.includes('--help') || words.includes('-h')) return { ...options, help: true }
  let positional = null
  let index = 0
  while (index < words.length) {
    const step = consumeAllocWord(options, words, index, positional)
    positional = step.positional
    index = step.next
  }
  if (positional) options.scale = positional
  return options
}

export function printAllocHelp() {
  console.log(USAGE)
}

function benchModuleUrl(benchDir, rel) {
  return pathToFileURL(path.join(benchDir, rel)).href
}

function spawnCapture(command, args, cwd, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
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

async function generateAllocRepo(ctx) {
  const plans = await import(benchModuleUrl(ctx.benchDir, 'generate/plans.ts'))
  const generators = await import(benchModuleUrl(ctx.benchDir, 'generate/generators/index.ts'))
  const plan = plans.resolvePlan(ctx.options.scale, {})
  const dir = mkdtempSync(path.join(tmpdir(), 'neo-alloc-'))
  const generated = generators.generateRepo(plan, dir)
  console.log(`[agent-rs] alloc repo: ${generated.styleFiles} files, ${generated.cssCalls} css() calls, seed ${plan.seed}`)
  return { dir, plan, generated }
}

function cleanEnv() {
  const env = { ...process.env }
  delete env[NATIVE_PATH_ENV]
  delete env[TRACE_OUT_ENV]
  return env
}

function workerInvocation(benchDir, repoDir) {
  const workerPath = path.join(benchDir, 'measure/worker.ts')
  return { workerPath, args: [workerPath, repoDir, String(WORKER_SAMPLE_MS)] }
}

async function runGcLeg(ctx, repo) {
  const { workerPath, args } = workerInvocation(ctx.benchDir, repo.dir)
  const nodeArgs = ['--trace-gc']
  console.log('[agent-rs] alloc GC leg: node --trace-gc <bench worker> (shipped .node)')
  const result = await spawnCapture(process.execPath, [...nodeArgs, ...args], ctx.repoRoot, cleanEnv())
  if (result.code !== 0) throw new Error(`GC leg failed (code ${result.code})${result.error ? `: ${result.error}` : ''}`)
  const sample = parseWorkerSample(result.stdout, 'GC')
  // V8 prints --trace-gc lines to stdout, interleaved with the sample JSON.
  const { events, summary } = parseGcLog(result.stdout)
  return {
    sample,
    nodeArgs,
    command: [process.execPath, ...nodeArgs, ...args],
    gcEvents: events,
    gcSummary: summary,
    rawLog: result.stdout,
    workerPath,
  }
}

async function runTraceLeg(ctx, repo, evidenceDir, traceBinary) {
  mkdirSync(evidenceDir, { recursive: true })
  const rustAllocPath = path.join(evidenceDir, 'rust-alloc.json')
  const { args } = workerInvocation(ctx.benchDir, repo.dir)
  const nodeArgs = ['--trace-gc']
  const env = {
    ...cleanEnv(),
    [NATIVE_PATH_ENV]: traceBinary,
    [TRACE_OUT_ENV]: rustAllocPath,
  }
  console.log('[agent-rs] alloc trace leg: node --trace-gc <bench worker> (release+alloc-trace .node)')
  const spawnEpochMs = Date.now()
  const result = await spawnCapture(process.execPath, [...nodeArgs, ...args], ctx.repoRoot, env)
  if (result.code !== 0) throw new Error(`trace leg failed (code ${result.code})${result.error ? `: ${result.error}` : ''}`)
  writeFileSync(path.join(evidenceDir, 'trace-stderr.log'), result.stderr)
  const sample = parseWorkerSample(result.stdout, 'trace')
  const { events, summary } = parseGcLog(result.stdout)
  let rust
  try {
    rust = JSON.parse(readFileSync(rustAllocPath, 'utf-8'))
  } catch {
    throw new Error(`trace leg wrote no span dump at ${rustAllocPath} — the worker did not load the trace binary`)
  }
  if (!rust || rust.schema !== 1 || !rust.span || !rust.process) {
    throw new Error(`trace leg span dump at ${rustAllocPath} has an unexpected shape`)
  }
  return {
    sample,
    nodeArgs,
    command: [process.execPath, ...nodeArgs, ...args],
    env: { [NATIVE_PATH_ENV]: traceBinary, [TRACE_OUT_ENV]: rustAllocPath },
    rust,
    spawnEpochMs,
    traceGcEvents: events,
    traceGcSummary: summary,
    rawLog: result.stdout,
  }
}

function cleanupRepo(repo, keep) {
  if (keep) {
    console.log(`[agent-rs] alloc repo kept at ${repo.dir}`)
    return
  }
  rmSync(repo.dir, { recursive: true, force: true })
}

function printAllocReport(evidenceDir, meta) {
  const gc = meta.gcLeg.gc
  const span = meta.traceLeg.rustSpan
  const window = meta.traceLeg.window
  console.log(`\n[agent-rs] alloc evidence: ${evidenceDir}`)
  console.log(`  gc leg: ${meta.gcLeg.sample.syncMs.toFixed(1)} ms, rss peak ${(meta.gcLeg.sample.rssPeak / 1048576).toFixed(0)} MiB`)
  console.log(`  shipped census: ${gc.scavenges} scavenges, ${gc.fullGcs} full GCs (${gc.events} events)`)
  console.log(`  trace leg: span ${span.wallMs.toFixed(1)} ms, alloc ${(span.allocBytes / 1048576).toFixed(1)} MiB, live at exit ${(span.liveAtExit / 1048576).toFixed(1)} MiB`)
  console.log(`  window: ${window.inWindowFull} in-window full GCs (${window.headFull} head, ${window.tailFull} tail, ${window.edgeFull} edge)`)
  if (window.edgeFull > 0) console.log('  R1 verdict: AMBIGUOUS — edge-straddling full GCs, re-run\n')
  else if (window.inWindowFull === 0) console.log('  R1 verdict: PASS — zero in-window mark-sweep/mark-compact\n')
  else console.log('  R1 verdict: FAIL — in-window full GCs observed\n')
}

async function captureAlloc(ctx, evidenceDir, natives) {
  const repo = await generateAllocRepo(ctx)
  try {
    const gcLeg = await runGcLeg(ctx, repo)
    const traceLeg = await runTraceLeg(ctx, repo, evidenceDir, natives.traceBinary)
    const legs = { gc: gcLeg, trace: traceLeg }
    const meta = buildAllocMeta({ ...ctx, procedure: ALLOC_PROCEDURE }, repo, legs, {
      shipped: natives.shipped,
      trace: describeTraceNative(ctx.rsDir, natives.traceBinary, natives.inputsHash),
    })
    writeAllocEvidence(evidenceDir, legs, meta)
    printAllocReport(evidenceDir, meta)
  } finally {
    cleanupRepo(repo, ctx.options.keep)
  }
}

export async function listAllocScales(benchDir) {
  const plans = await import(benchModuleUrl(benchDir, 'generate/plans.ts'))
  for (const plan of plans.listProfiles()) {
    console.log(`${plan.scale} [${plan.generator}]: ${plan.files} files, seed ${plan.seed}`)
  }
}

export async function runAllocCommand(args, repoRoot, rsDir) {
  let options
  try {
    options = parseAllocArgs(args)
  } catch (err) {
    console.error(`[agent-rs] ${err.message}`)
    return 1
  }
  const benchDir = path.join(repoRoot, 'packages', 'reference-neo', 'benchmark')
  if (options.help) {
    printAllocHelp()
    return 0
  }
  if (options.list) {
    await listAllocScales(benchDir)
    return 0
  }
  const pinModule = await import(benchModuleUrl(benchDir, 'report/pin.ts'))
  const pin = pinModule.resolvePin(benchDir)
  const evidenceDir = resolveAllocEvidenceDir(repoRoot, options, pin)
  let shipped
  try {
    shipped = describeShippedNative(rsDir, options.noBuild)
  } catch (err) {
    console.error(`[agent-rs] ${err.message}`)
    return 1
  }
  const ctx = { repoRoot, rsDir, benchDir, options, pin }
  let trace
  try {
    trace = await ensureTraceNative(ctx)
  } catch (err) {
    console.error(`[agent-rs] ${err.message}`)
    return 1
  }
  try {
    await withCpuGate('rs', `agentrs alloc ${options.scale}`, () =>
      captureAlloc(ctx, evidenceDir, { shipped, traceBinary: trace.binaryPath, inputsHash: trace.inputsHash }),
    )
  } catch (err) {
    console.error(`[agent-rs] alloc failed: ${err instanceof Error ? err.message : String(err)}`)
    return 1
  }
  return 0
}
