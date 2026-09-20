// Agent- and human-facing CLI over the Neo sync benchmark.
// It takes optional scales plus overrides and emits one pinned report covering every scale.
// Bench never runs inside the unit or case suites: no case.json, no *.test.ts, one explicit command.
// Each scale generates a seeded repo, syncs it in fresh children, and all scales pin a single combined report.
// The pin resolves before generation, so writing the report cannot dirty its own verdict.

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { generateRepo } from './generate/generators/index.ts'
import { listProfiles, resolvePlan, resolveScales, type PlanOverrides } from './generate/plans.ts'
import { readBundleSizes, runChild, type WorkerSample } from './measure/child.ts'
import { renderReadout, type ScaleResult } from './report/markdown.ts'
import { resolvePin } from './report/pin.ts'
import { writeReport } from './report/write.ts'
import { getOutDirPath } from '../src/lib/paths/out-dir.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const SAMPLE_MS = 10

interface CliOptions {
  scales: string | undefined
  runs: number | undefined
  keep: boolean
  json: boolean
  overrides: PlanOverrides
}

interface ScaleContext {
  runs: number | undefined
  keep: boolean
  overrides: PlanOverrides
}

const USAGE = [
  'usage: bench:neo [--scale name[,name]] [--runs N] [--seed N]',
  '               [--files N] [--calls N] [--unique 0..1] [--keep] [--json]',
  '       bench:neo --list   (default suite: small,medium,enterprise; churn is opt-in)',
].join('\n')

function parseNumberFlag(argv: string[], index: number, flag: string): number {
  const raw = argv[index + 1]
  if (raw === undefined) throw new Error(`${flag} needs a value`)
  const value = Number(raw)
  if (!Number.isFinite(value)) throw new Error(`${flag} needs a number, got: ${raw}`)
  return value
}

function applyValueFlag(options: CliOptions, argv: string[], index: number): number | null {
  const arg = argv[index] as string
  switch (arg) {
    case '--scale': {
      const scale = argv[index + 1]
      if (!scale) throw new Error('--scale needs a value')
      options.scales = scale
      return index + 2
    }
    case '--runs':
      options.runs = parseNumberFlag(argv, index, '--runs')
      return index + 2
    case '--seed':
      options.overrides.seed = parseNumberFlag(argv, index, '--seed')
      return index + 2
    case '--files':
      options.overrides.files = parseNumberFlag(argv, index, '--files')
      return index + 2
    case '--calls':
      options.overrides.calls = parseNumberFlag(argv, index, '--calls')
      return index + 2
    case '--unique':
      options.overrides.unique = parseNumberFlag(argv, index, '--unique')
      return index + 2
    default:
      return null
  }
}

function applyFlag(options: CliOptions, argv: string[], index: number): number {
  const valued = applyValueFlag(options, argv, index)
  if (valued !== null) return valued
  const arg = argv[index] as string
  if (arg === '--keep') {
    options.keep = true
    return index + 1
  }
  if (arg === '--json') {
    options.json = true
    return index + 1
  }
  throw new Error(`unknown flag: ${arg}\n${USAGE}`)
}

function stripSeparator(argv: string[]): string[] {
  return argv.filter((arg) => arg !== '--')
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    scales: undefined,
    runs: undefined,
    keep: false,
    json: false,
    overrides: {},
  }
  let index = 0
  while (index < argv.length) index = applyFlag(options, argv, index)
  if (options.runs !== undefined && (!Number.isInteger(options.runs) || options.runs < 1 || options.runs > 25)) {
    throw new Error('--runs needs an integer from 1 to 25')
  }
  return options
}

function printProfiles(): void {
  for (const plan of listProfiles()) {
    const calls = `${plan.minCalls}-${plan.maxCalls}`
    const optIn = plan.optIn ? ' (opt-in)' : ''
    console.log(
      `${plan.scale} [${plan.generator}]${optIn}: ${plan.files} files x ${calls} calls, `
        + `${plan.deadFiles} dead, ${plan.recipes} recipes, unique ${plan.uniqueRatio}, ${plan.defaultRuns} run(s)`,
    )
  }
}

async function collectSamples(projectDir: string, runs: number): Promise<WorkerSample[]> {
  const workerPath = join(HERE, 'measure/worker.ts')
  const samples: WorkerSample[] = []
  for (let run = 0; run < runs; run += 1) {
    samples.push(await runChild(workerPath, projectDir, SAMPLE_MS))
  }
  return samples
}

function cleanup(projectDir: string, keep: boolean): void {
  if (keep) {
    console.log(`kept synthetic repo at ${projectDir}`)
    return
  }
  rmSync(projectDir, { recursive: true, force: true })
}

async function runScale(name: string, ctx: ScaleContext): Promise<ScaleResult> {
  const plan = resolvePlan(name, ctx.overrides)
  const runs = ctx.runs ?? plan.defaultRuns
  const projectDir = mkdtempSync(join(tmpdir(), 'neo-bench-'))
  try {
    const genStarted = performance.now()
    const generated = generateRepo(plan, projectDir)
    const genMs = performance.now() - genStarted
    console.log(
      `[bench] ${plan.scale}: ${generated.styleFiles} files, `
        + `${generated.cssCalls} css() calls, ${runs} run(s), seed ${plan.seed}`,
    )
    const samples = await collectSamples(projectDir, runs)
    const bundle = readBundleSizes(getOutDirPath(projectDir))
    cleanup(projectDir, ctx.keep)
    return {
      plan,
      generated: {
        styleFiles: generated.styleFiles,
        deadFiles: generated.deadFiles,
        cssCalls: generated.cssCalls,
        recipes: generated.recipes,
      },
      genMs,
      samples,
      bundle,
    }
  } catch (err) {
    cleanup(projectDir, ctx.keep)
    throw err
  }
}

async function main(argv: string[]): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE)
    return 0
  }
  if (argv.includes('--list')) {
    printProfiles()
    return 0
  }
  const options = parseArgs(stripSeparator(argv))
  const pin = resolvePin(HERE)
  const names = resolveScales(options.scales)
  const ctx: ScaleContext = { runs: options.runs, keep: options.keep, overrides: options.overrides }
  const scales: ScaleResult[] = []
  for (const name of names) scales.push(await runScale(name, ctx))
  const { dir, record } = writeReport(join(HERE, 'reports'), pin, { scales })
  console.log(renderReadout(record))
  console.log(`report: ${dir}`)
  if (options.json) console.log(JSON.stringify(record))
  return 0
}

try {
  process.exitCode = await main(process.argv.slice(2))
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
}
