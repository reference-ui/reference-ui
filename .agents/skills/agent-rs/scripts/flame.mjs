/**
 * Samply flame harness behind `pnpm agentrs flame`.
 *
 * It takes a frozen bench scale and emits a recorded CPU profile of the real
 * sync path: the benchmark generator builds the repo, then samply records the
 * benchmark worker (release `.node`, `--perf-basic-prof` so JS frames resolve)
 * straight through the N-API boundary. Evidence lands under
 * docs/evidence/flamegraph/ as profile, presymbolicated sidecar, meta, summary.
 * The load stays locked: scale names only, no seed or size overrides, ever.
 * A filed bundle can be reprocessed without re-recording via --resummarize.
 */

import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { withCpuGate } from '../../test-core/scripts/cpu-gate.mjs'
import { attachPhaseBuckets, buildFlameMeta, resolveEvidenceDir, runResummarize, writeFlameEvidence } from './flame-evidence.mjs'
import { phasesEnvFor } from './phases.mjs'

const FLAME_PROCEDURE = 'agentrs-flame/3'
const FLAME_PROCEDURE_NOTE = 'same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)'
const DEFAULT_SCALE = 'enterprise'
const DEFAULT_RATE_HZ = 1000
const WORKER_SAMPLE_MS = 10

const USAGE = [
  'usage: pnpm agentrs flame [-- scale] [--out dir] [--keep] [--rate hz] [--no-build]',
  '       pnpm agentrs flame --resummarize <srcDir> [--out dir]   (reprocess a filed bundle, no re-record)',
  '       pnpm agentrs flame --list   (frozen bench scales; enterprise is the default)',
  'example: pnpm agentrs flame -- enterprise',
].join('\n')

function usageError(message) {
  const err = new Error(`${message}\n${USAGE}`)
  err.code = 'FLAME_USAGE'
  return err
}

function applyValuedFlag(options, words, index) {
  const arg = words[index]
  if (arg !== '--out' && arg !== '--rate') return null
  const value = words[index + 1]
  if (!value) throw usageError(`${arg} needs a value`)
  if (arg === '--out') options.outDir = value
  else options.rate = parseRate(value)
  return index + 2
}

function applyToggleFlag(options, arg) {
  if (arg === '--keep') options.keep = true
  else if (arg === '--no-build') options.noBuild = true
  else return false
  return true
}

function consumeFlameWord(options, words, index, positional) {
  const arg = words[index]
  const valued = applyValuedFlag(options, words, index)
  if (valued !== null) return { next: valued, positional }
  if (applyToggleFlag(options, arg)) return { next: index + 1, positional }
  if (arg.startsWith('-')) throw usageError(`unknown flag: ${arg}`)
  if (positional) throw usageError(`one scale only, got: ${positional} and ${arg}`)
  return { next: index + 1, positional: arg }
}

function consumeFlameWords(options, words) {
  let positional = null
  let index = 0
  while (index < words.length) {
    const step = consumeFlameWord(options, words, index, positional)
    positional = step.positional
    index = step.next
  }
  if (positional) options.scale = positional
  return options
}

function checkEarlyExit(options, words) {
  if (words.includes('--list')) return { ...options, list: true }
  if (words.includes('--help') || words.includes('-h')) return { ...options, help: true }
  return null
}

export function parseFlameArgs(argv) {
  const options = { scale: DEFAULT_SCALE, outDir: null, keep: false, rate: DEFAULT_RATE_HZ, noBuild: false, resummarize: null }
  const words = argv.filter((arg) => arg !== '--')
  const early = checkEarlyExit(options, words)
  if (early) return early
  if (words.includes('--resummarize')) return parseResummarizeArgs(options, words)
  return consumeFlameWords(options, words)
}

function parseResummarizeArgs(options, words) {
  for (let i = 0; i < words.length; i += 1) {
    const arg = words[i]
    if (arg !== '--resummarize' && arg !== '--out') {
      throw usageError(`--resummarize takes only --out, got: ${arg}`)
    }
    const value = words[i + 1]
    if (!value || value.startsWith('-')) throw usageError(`${arg} needs a value`)
    if (arg === '--resummarize') options.resummarize = value
    else options.outDir = value
    i += 1
  }
  if (!options.resummarize) throw usageError('--resummarize needs a source evidence dir')
  return options
}

function parseRate(value) {
  const rate = Number(value)
  if (!Number.isInteger(rate) || rate < 10 || rate > 10000) {
    throw usageError(`--rate needs an integer 10..10000, got: ${value}`)
  }
  return rate
}

export function printFlameHelp() {
  console.log(USAGE)
}

export function checkSamply() {
  const probe = spawnSync('samply', ['--version'], { encoding: 'utf-8' })
  if (probe.status === 0 && probe.stdout) return probe.stdout.trim()
  throw new Error('samply not found on PATH — install it with: cargo install samply')
}

export function nativeBinaryPath(rsDir) {
  const triple = process.platform === 'darwin'
    ? (process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64')
    : 'linux-x64-gnu'
  return path.join(rsDir, 'dist', 'native', `virtual-native.${triple}.node`)
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function benchModuleUrl(benchDir, rel) {
  return pathToFileURL(path.join(benchDir, rel)).href
}

function spawnCapture(command, args, cwd, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'inherit'] })
    let stdout = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf-8')
    })
    child.on('error', (err) => resolve({ code: 1, stdout, error: err.message }))
    child.on('close', (code) => resolve({ code: code ?? 0, stdout }))
  })
}

function listPerfMaps() {
  const found = new Set()
  const dirs = new Set([tmpdir(), '/tmp'])
  for (const dir of dirs) {
    let entries = []
    try {
      entries = readdirSync(dir)
    } catch {
      continue
    }
    for (const entry of entries) {
      if (entry.startsWith('perf-') && entry.endsWith('.map')) found.add(path.join(dir, entry))
    }
  }
  return found
}

function removeNewPerfMaps(before) {
  for (const file of listPerfMaps()) {
    if (!before.has(file)) {
      try {
        rmSync(file, { force: true })
      } catch {}
    }
  }
}

function parseWorkerSample(stdout) {
  const lines = stdout.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('{'))
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      const parsed = JSON.parse(lines[i])
      if (parsed && typeof parsed.syncMs === 'number') return parsed
    } catch {}
  }
  throw new Error('bench worker printed no sample JSON under samply')
}

async function generateFlameRepo(ctx) {
  const plans = await import(benchModuleUrl(ctx.benchDir, 'generate/plans.ts'))
  const generators = await import(benchModuleUrl(ctx.benchDir, 'generate/generators/index.ts'))
  const plan = plans.resolvePlan(ctx.options.scale, {})
  const dir = mkdtempSync(path.join(tmpdir(), 'neo-flame-'))
  const generated = generators.generateRepo(plan, dir)
  console.log(`[agent-rs] flame repo: ${generated.styleFiles} files, ${generated.cssCalls} css() calls, seed ${plan.seed}`)
  return { dir, plan, generated }
}

function v8AuxFlags(runDir) {
  // The perf map stays at its default /tmp location: samply only discovers
  // /tmp/perf-<pid>.map, and a custom path silently loses all JS frames.
  // The run dir still contains v8.log; the map is removed by diff below.
  return ['--perf-basic-prof', `--logfile=${path.join(runDir, 'v8.log')}`]
}

async function recordFlameProfile(ctx, repo, evidenceDir) {
  mkdirSync(evidenceDir, { recursive: true })
  const profilePath = path.join(evidenceDir, 'profile.json.gz')
  const workerPath = path.join(ctx.benchDir, 'measure/worker.ts')
  const runDir = mkdtempSync(path.join(tmpdir(), 'neo-flame-run-'))
  const v8Flags = v8AuxFlags(runDir)
  const nodeArgs = [...v8Flags, workerPath, repo.dir, String(WORKER_SAMPLE_MS)]
  const command = [
    'record', '--save-only', '--unstable-presymbolicate',
    '-o', profilePath, '-r', String(ctx.options.rate),
    '--', process.execPath, ...nodeArgs,
  ]
  const before = listPerfMaps()
  const phasesEnv = phasesEnvFor(evidenceDir, 'phases.json')
  console.log(`[agent-rs] samply record -r ${ctx.options.rate} -- node --perf-basic-prof <bench worker>`)
  const result = await spawnCapture('samply', command, runDir, { ...process.env, ...phasesEnv })
  removeNewPerfMaps(before)
  rmSync(runDir, { recursive: true, force: true })
  if (result.code !== 0) throw new Error(`samply record failed (code ${result.code})${result.error ? `: ${result.error}` : ''}`)
  const sample = parseWorkerSample(result.stdout)
  const sidecarPath = `${profilePath.replace(/\.gz$/, '')}.syms.json`
  let sidecar = null
  try {
    statSync(sidecarPath)
    sidecar = sidecarPath
  } catch {
    console.log('[agent-rs] flame: no presymbolicated sidecar emitted; summary will be skipped')
  }
  return { profilePath, sidecarPath: sidecar, phasesPath: phasesEnv.REFERENCE_UI_PHASES_OUT, sample, nodeArgs: v8Flags, command: ['samply', ...command] }
}

function cleanupRepo(repo, keep) {
  if (keep) {
    console.log(`[agent-rs] flame repo kept at ${repo.dir}`)
    return
  }
  rmSync(repo.dir, { recursive: true, force: true })
}

function printFlameReport(evidenceDir, meta, summary) {
  console.log(`\n[agent-rs] flame evidence: ${evidenceDir}`)
  console.log(`  sync: ${meta.worker.syncMs.toFixed(1)} ms, rss peak ${(meta.worker.rssPeak / 1048576).toFixed(0)} MiB`)
  console.log(`  profile: ${meta.profile.file} (${meta.profile.bytes} bytes, ${meta.profile.rateHz} Hz)`)
  if (summary) {
    console.log('  top native frames:')
    for (const frame of summary.nativeTop.slice(0, 5)) {
      console.log(`    ${frame.samples}x self / ${frame.inclusive}x incl ${frame.name.slice(0, 90)}`)
    }
  }
  if (meta.phases?.reconcile) {
    console.log(`  phases: compile ${meta.phases.phases.compile.toFixed(1)} ms of ${meta.phases.phases.syncTotal.toFixed(1)} ms sync (${meta.phases.reconcile.ok ? 'RECONCILED' : 'UNRECONCILED'})`)
  }
  console.log('  view: samply load profile.json.gz\n')
}

async function captureFlame(ctx, evidenceDir) {
  const repo = await generateFlameRepo(ctx)
  try {
    const record = attachPhaseBuckets(await recordFlameProfile(ctx, repo, evidenceDir), 'flame')
    const meta = buildFlameMeta({ ...ctx, procedure: FLAME_PROCEDURE, procedureNote: FLAME_PROCEDURE_NOTE }, repo, record, ctx.native)
    const summary = writeFlameEvidence(evidenceDir, record, meta)
    printFlameReport(evidenceDir, meta, summary)
  } finally {
    cleanupRepo(repo, ctx.options.keep)
  }
}

function describeNative(rsDir, skippedBuild) {
  const filePath = nativeBinaryPath(rsDir)
  try {
    statSync(filePath)
  } catch {
    throw new Error(`native binary missing at ${filePath} — run pnpm agentrs build first`)
  }
  return {
    path: path.relative(process.cwd(), filePath) || filePath,
    sha256: sha256File(filePath),
    profile: 'release',
    builtVia: skippedBuild ? 'prebuilt (ensure-native skipped with --no-build)' : 'napi build --release via ensure-native',
  }
}

export async function listFlameScales(benchDir) {
  const plans = await import(benchModuleUrl(benchDir, 'generate/plans.ts'))
  for (const plan of plans.listProfiles()) {
    console.log(`${plan.scale} [${plan.generator}]: ${plan.files} files, seed ${plan.seed}`)
  }
}

export async function runFlameCommand(args, repoRoot, rsDir) {
  let options
  try {
    options = parseFlameArgs(args)
  } catch (err) {
    console.error(`[agent-rs] ${err.message}`)
    return 1
  }
  const benchDir = path.join(repoRoot, 'packages', 'reference-neo', 'benchmark')
  if (options.help) {
    printFlameHelp()
    return 0
  }
  if (options.list) {
    await listFlameScales(benchDir)
    return 0
  }
  if (options.resummarize) {
    try {
      runResummarize({
        srcDir: options.resummarize,
        outDir: options.outDir,
        repoRoot,
        procedure: FLAME_PROCEDURE,
        procedureNote: FLAME_PROCEDURE_NOTE,
        command: ['pnpm', 'agentrs', 'flame', ...args],
      })
    } catch (err) {
      console.error(`[agent-rs] flame resummarize failed: ${err instanceof Error ? err.message : String(err)}`)
      return 1
    }
    return 0
  }
  let samplyVersion
  try {
    samplyVersion = checkSamply()
  } catch (err) {
    console.error(`[agent-rs] ${err.message}`)
    return 1
  }
  const pinModule = await import(benchModuleUrl(benchDir, 'report/pin.ts'))
  const pin = pinModule.resolvePin(benchDir)
  const evidenceDir = resolveEvidenceDir(repoRoot, options, pin)
  let native
  try {
    native = describeNative(rsDir, options.noBuild)
  } catch (err) {
    console.error(`[agent-rs] ${err.message}`)
    return 1
  }
  const ctx = { repoRoot, benchDir, options, pin, samplyVersion, native }
  try {
    await withCpuGate('rs', `agentrs flame ${options.scale}`, () => captureFlame(ctx, evidenceDir))
  } catch (err) {
    console.error(`[agent-rs] flame failed: ${err instanceof Error ? err.message : String(err)}`)
    return 1
  }
  return 0
}
