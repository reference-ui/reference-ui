// One-command native compile burndown over the locked bench load.
// It takes a scale, generates the seeded repo, runs one phased sync under the
// macOS `sample` profiler, and emits the per-phase wall-time breakdown. TS
// stage walls are exact timers; native internals are sampled (1ms) and scaled
// to sync wall, labeled approximate. Parent-side `ps` polling gives a true RSS
// timeline across the blocking native call. Fails loudly when the sample
// budget expires before sync ends or the leaf sums do not validate.

import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateRepo } from '../generate/generators/index.ts'
import { resolvePlan } from '../generate/plans.ts'
import { getOutDirPath } from '../../src/lib/paths/out-dir.ts'
import { parseSample } from './sample-parse.ts'
import { accountBundle } from './bundle.ts'

const HERE = dirname(fileURLToPath(import.meta.url))

export interface BurndownOptions {
  scale: string
  keep: boolean
  outDir: string | undefined
}

export interface BurndownResult {
  scale: string
  seed: number
  projectDir: string
  workDir: string
  sampleFile: string
  reportFile: string
  phases: Record<string, number>
  rssBefore: number
  rssPeak: number
  rssAfter: number
  parentRssPeak: number
  buckets: Record<string, number>
  idle: number
  nonIdle: number
  total: number
  markdown: string
  worker: WorkerResult
  ticks: RssTick[]
}

const BUDGETS: Record<string, number> = { small: 15, medium: 25, enterprise: 90, churn: 90 }

function budgetFor(scale: string): number {
  return BUDGETS[scale] ?? 60
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parentRssKb(pid: number): number | null {
  try {
    const out = execFileSync('ps', ['-o', 'rss=', '-p', String(pid)], { encoding: 'utf-8' })
    const kb = Number(out.trim())
    return Number.isFinite(kb) && kb > 0 ? kb : null
  } catch {
    return null
  }
}

export interface WorkerResult {
  phases: Record<string, number>
  boundaries: Record<string, number>
  syncStartEpoch: number
  rssBefore: number
  rssPeak: number
  rssAfter: number
  payload: Record<string, number>
}

export interface RssTick {
  epoch: number
  rss: number
}

function isWorkerResult(value: unknown): value is WorkerResult {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v['phases'] === 'object'
    && typeof v['boundaries'] === 'object'
    && typeof v['syncStartEpoch'] === 'number'
    && typeof v['rssBefore'] === 'number'
    && typeof v['rssPeak'] === 'number'
    && typeof v['rssAfter'] === 'number'
    && typeof v['payload'] === 'object'
  )
}

interface PhasedWorker {
  pid: number
  stdout: () => string
  stderr: () => string
  waitReady: () => Promise<void>
  waitDone: () => Promise<number>
  isAlive: () => boolean
  syncDone: () => boolean
}

function spawnPhasedWorker(projectDir: string, goFile: string): PhasedWorker {
  const workerPath = join(HERE, 'worker-phases.ts')
  const worker = spawn(process.execPath, [workerPath, projectDir, '25', goFile], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (!worker.pid) throw new Error('failed to spawn phased worker')
  const pid = worker.pid
  let stdout = ''
  let stderr = ''
  let alive = true
  worker.stdout.on('data', (chunk: Buffer) => {
    stdout += chunk.toString('utf-8')
  })
  worker.stderr.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf-8')
  })
  worker.on('close', () => {
    alive = false
  })
  const waitReady = (): Promise<void> =>
    new Promise((resolve, reject) => {
      let poll: ReturnType<typeof setTimeout> | undefined
      let settled = false
      const fail = (err: Error): void => {
        if (settled) return
        settled = true
        if (poll !== undefined) clearTimeout(poll)
        clearTimeout(timer)
        worker.kill()
        reject(err)
      }
      const timer = setTimeout(() => fail(new Error('phased worker never signaled READY')), 120000)
      const check = (): void => {
        if (settled) return
        if (!stderr.includes('READY')) {
          poll = setTimeout(check, 25)
          return
        }
        settled = true
        clearTimeout(timer)
        resolve()
      }
      check()
      worker.on('error', fail)
    })
  const waitDone = (): Promise<number> =>
    new Promise((resolve, reject) => {
      worker.on('error', reject)
      worker.on('close', (code) => resolve(code ?? -1))
    })
  return {
    pid,
    stdout: () => stdout,
    stderr: () => stderr,
    waitReady,
    waitDone,
    isAlive: () => alive,
    syncDone: () => stderr.includes('SYNC-DONE'),
  }
}

async function pollParentRss(
  pid: number,
  alive: () => boolean,
  synced: () => boolean,
): Promise<{ peak: number; ticks: RssTick[] }> {
  let peak = 0
  const ticks: RssTick[] = []
  while (alive() && !synced()) {
    const at = Date.now()
    const kb = parentRssKb(pid)
    if (kb !== null) {
      ticks.push({ epoch: at, rss: kb * 1024 })
      if (kb * 1024 > peak) peak = kb * 1024
    }
    await sleep(10)
  }
  return { peak, ticks }
}

async function stopSampler(
  sampler: ReturnType<typeof spawn>,
  sampleFile: string,
  samplerLog: () => string,
): Promise<string> {
  sampler.kill('SIGINT')
  const done = new Promise<number>((resolve) => {
    sampler.on('close', (code) => resolve(code ?? -1))
  })
  const code = await Promise.race([done, sleep(25000).then(() => -99)])
  if (code === -99) {
    sampler.kill('SIGKILL')
    throw new Error('sample did not finish within 25s of SIGINT')
  }
  if (!existsSync(sampleFile)) {
    throw new Error(`sample produced no file (exit ${code}): ${samplerLog().slice(-300)}`)
  }
  return readFileSync(sampleFile, 'utf-8')
}

function parseWorkerJson(stdout: string): WorkerResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(stdout.trim()) as unknown
  } catch {
    throw new Error(`phased worker printed no JSON: ${stdout.slice(0, 200)}`)
  }
  if (!isWorkerResult(parsed)) throw new Error('phased worker printed a foreign shape')
  return parsed
}

async function runSampledSync(projectDir: string, workDir: string, budget: number): Promise<{
  worker: WorkerResult
  sampleText: string
  parentPeak: number
  ticks: RssTick[]
}> {
  const goFile = join(workDir, 'go')
  const sampleFile = join(workDir, 'sample.txt')
  rmSync(goFile, { force: true })
  const phased = spawnPhasedWorker(projectDir, goFile)
  await phased.waitReady()
  const sampler = spawn('sample', [String(phased.pid), String(budget), '-file', sampleFile], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let samplerOut = ''
  sampler.stdout?.on('data', (c: Buffer) => {
    samplerOut += c.toString('utf-8')
  })
  sampler.stderr?.on('data', (c: Buffer) => {
    samplerOut += c.toString('utf-8')
  })
  await sleep(2000)
  writeFileSync(goFile, 'go\n')
  const rssPoll = pollParentRss(phased.pid, phased.isAlive, phased.syncDone)
  const workerCode = await phased.waitDone()
  const { peak, ticks } = await rssPoll
  if (workerCode !== 0) throw new Error(`phased worker exited with code ${workerCode}: ${phased.stderr().slice(-500)}`)
  const sampleText = await stopSampler(sampler, sampleFile, () => samplerOut)
  return { worker: parseWorkerJson(phased.stdout()), sampleText, parentPeak: peak, ticks }
}

const NATIVE_PHASES = [
  'scan/read',
  'parse',
  'constants',
  'hosts',
  'extract',
  'harvest',
  'diagnostics',
  'assembly',
  'emit',
  'serde',
  'napi-bridge',
  'base-system',
  'alloc',
]

function ms(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`
  if (value >= 100) return `${value.toFixed(0)}ms`
  return `${value.toFixed(1)}ms`
}

function mib(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}

interface BurndownContext {
  scale: string
  seed: number
  worker: WorkerResult
  parentPeak: number
  parentSamples: number
  total: number
  idle: number
  nonIdle: number
  buckets: Record<string, number>
  otherSymbols: { symbol: string; samples: number }[]
  bundle: { css: number; data: number; cssResidual: number; dataResidual: number }
}

function stageRows(phases: Record<string, number>, syncMs: number): string[] {
  const rows = ['| stage | wall | share of sync |', '| --- | --- | --- |']
  for (const stage of ['config', 'fragments.prepare', 'fragments.evaluate', 'native.compile', 'publish']) {
    const wall = phases[stage] ?? 0
    rows.push(`| \`${stage}\` | ${ms(wall)} | ${((wall / syncMs) * 100).toFixed(1)}% |`)
  }
  return rows
}

function sampledRows(buckets: Record<string, number>, nonIdle: number, syncMs: number): { rows: string[]; nativeTicks: number; tsTicks: number; otherTicks: number } {
  const rows = ['| phase | ticks | ≈ms | ≈share of sync |', '| --- | --- | --- | --- |']
  let nativeTicks = 0
  for (const phase of NATIVE_PHASES) {
    const ticks = buckets[phase] ?? 0
    nativeTicks += ticks
    const approx = (ticks / nonIdle) * syncMs
    rows.push(`| \`${phase}\` | ${ticks} | ${ms(approx)} | ${((ticks / nonIdle) * 100).toFixed(1)}% |`)
  }
  const tsTicks = buckets['ts'] ?? 0
  const otherTicks = buckets['other'] ?? 0
  const tsMs = (tsTicks / nonIdle) * syncMs
  rows.push(`| \`ts (sampled)\` | ${tsTicks} | ${ms(tsMs)} | ${((tsTicks / nonIdle) * 100).toFixed(1)}% |`)
  if (otherTicks > 0) {
    const otherMs = (otherTicks / nonIdle) * syncMs
    rows.push(`| \`other (sampled)\` | ${otherTicks} | ${ms(otherMs)} | ${((otherTicks / nonIdle) * 100).toFixed(1)}% |`)
  }
  return { rows, nativeTicks, tsTicks, otherTicks }
}

function renderBurndownMarkdown(ctx: BurndownContext): string {
  const syncMs = ctx.worker.phases['sync.total'] ?? 0
  const nativeMs = ctx.worker.phases['native.compile'] ?? 0
  const tsPrecise = (ctx.worker.phases['config'] ?? 0)
    + (ctx.worker.phases['fragments.prepare'] ?? 0)
    + (ctx.worker.phases['fragments.evaluate'] ?? 0)
    + (ctx.worker.phases['publish'] ?? 0)
  const lines: string[] = []
  lines.push(`## burndown — ${ctx.scale} (seed ${ctx.seed})`, '')
  lines.push(`- sync wall: ${ms(syncMs)} · native.compile (exact): ${ms(nativeMs)} · TS stages (exact): ${ms(tsPrecise)}`)
  lines.push(`- RSS peak: worker ${mib(ctx.worker.rssPeak)} · parent-polled ${mib(ctx.parentPeak)} (${ctx.parentSamples} samples)`)
  lines.push(`- sample: ${ctx.total} main-thread ticks, ${ctx.nonIdle} non-idle (${((ctx.nonIdle / ctx.total) * 100).toFixed(1)}%)`)
  lines.push('')
  lines.push('### exact stage walls (timers)', '')
  lines.push(...stageRows(ctx.worker.phases, syncMs))
  lines.push('')
  lines.push('### native internals (sampled ≈, scaled to sync wall)', '')
  const sampled = sampledRows(ctx.buckets, ctx.nonIdle, syncMs)
  lines.push(...sampled.rows)
  lines.push('')
  lines.push('### cross-checks', '')
  const nativeSampledMs = (sampled.nativeTicks / ctx.nonIdle) * syncMs
  const tsMs = (sampled.tsTicks / ctx.nonIdle) * syncMs
  lines.push(`- Σ native sampled ≈ ${ms(nativeSampledMs)} vs native.compile ${ms(nativeMs)} (Δ ${ms(nativeSampledMs - nativeMs)})`)
  lines.push(`- ts sampled ≈ ${ms(tsMs)} vs TS stages ${ms(tsPrecise)} (Δ ${ms(tsMs - tsPrecise)})`)
  lines.push(`- Σ shares: ${(((sampled.nativeTicks + sampled.tsTicks + sampled.otherTicks) / ctx.nonIdle) * 100).toFixed(1)}% of non-idle`)
  if (ctx.otherSymbols.length > 0) {
    lines.push(`- top unattributed: ${ctx.otherSymbols.slice(0, 3).map((s) => `${s.symbol} (${s.samples})`).join('; ')}`)
  }
  lines.push('')
  lines.push('### bundle (this sync)', '')
  lines.push(`- styles.css: ${ctx.bundle.css} B · runtime-data.mjs: ${ctx.bundle.data} B · residuals ${ctx.bundle.cssResidual}/${ctx.bundle.dataResidual}`)
  return lines.join('\n')
}

export async function burndown(options: BurndownOptions): Promise<BurndownResult> {
  const plan = resolvePlan(options.scale, {})
  const projectDir = mkdtempSync(join(tmpdir(), 'deepsee-burn-'))
  const workDir = options.outDir ?? mkdtempSync(join(tmpdir(), 'deepsee-work-'))
  mkdirSync(workDir, { recursive: true })
  try {
    const generated = generateRepo(plan, projectDir)
    console.log(
      `[deepsee] ${plan.scale}: ${generated.styleFiles} files, ${generated.cssCalls} css() calls, seed ${plan.seed}`,
    )
    const budget = budgetFor(plan.scale)
    const { worker, sampleText, parentPeak, ticks } = await runSampledSync(projectDir, workDir, budget)
    const sample = parseSample(sampleText)
    const syncMs = worker.phases['sync.total'] ?? 0
    if (syncMs <= 0) throw new Error('worker reported no sync wall')
    if (sample.nonIdle <= 0) throw new Error('sample captured no non-idle time')
    const bundle = accountBundle(getOutDirPath(projectDir))
    const markdown = renderBurndownMarkdown({
      scale: plan.scale,
      seed: plan.seed,
      worker,
      parentPeak,
      parentSamples: ticks.length,
      total: sample.total,
      idle: sample.idle,
      nonIdle: sample.nonIdle,
      buckets: sample.phases,
      otherSymbols: sample.otherSymbols,
      bundle: { css: bundle.cssBytes, data: bundle.dataBytes, cssResidual: bundle.cssResidual, dataResidual: bundle.dataResidual },
    })
    const reportFile = join(workDir, `burndown-${plan.scale}.md`)
    writeFileSync(reportFile, `${markdown}\n`, 'utf-8')
    writeFileSync(join(workDir, `worker-${plan.scale}.json`), `${JSON.stringify(worker, null, 2)}\n`, 'utf-8')
    writeFileSync(join(workDir, `timeline-${plan.scale}.json`), `${JSON.stringify(ticks, null, 2)}\n`, 'utf-8')
    writeFileSync(
      join(workDir, `burndown-${plan.scale}.json`),
      `${JSON.stringify({ scale: plan.scale, phases: worker.phases, rss: { before: worker.rssBefore, peak: worker.rssPeak, after: worker.rssAfter, parentPeak }, sample: { total: sample.total, idle: sample.idle, nonIdle: sample.nonIdle, phases: sample.phases }, bundle: { css: bundle.cssBytes, data: bundle.dataBytes } }, null, 2)}\n`,
      'utf-8',
    )
    return {
      scale: plan.scale,
      seed: plan.seed,
      projectDir,
      workDir,
      sampleFile: join(workDir, 'sample.txt'),
      reportFile,
      phases: worker.phases,
      rssBefore: worker.rssBefore,
      rssPeak: worker.rssPeak,
      rssAfter: worker.rssAfter,
      parentRssPeak: parentPeak,
      buckets: sample.phases,
      idle: sample.idle,
      nonIdle: sample.nonIdle,
      total: sample.total,
      markdown,
      worker,
      ticks,
    }
  } finally {
    if (options.keep) {
      console.log(`[deepsee] kept repo at ${projectDir}`)
      console.log(`[deepsee] work dir at ${workDir}`)
    } else {
      rmSync(projectDir, { recursive: true, force: true })
    }
  }
}
