// RSS attribution over one locked-load sync: what is retained when peak hits.
// It takes a scale, runs one phased sync with parent-side `ps` polling, and
// attributes peak RSS to baseline, source texts, the N-API payload, and a
// residual (arenas, ASTs, constants, allocator overhead). Texts and payload
// are measured bytes times a stated copy-count model; the residual is honest
// remainder, never forced to zero. Phase boundaries from the worker mark
// where growth happens. All shares are labeled approximate except raw bytes.

import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateRepo } from '../generate/generators/index.ts'
import { resolvePlan } from '../generate/plans.ts'

const HERE = dirname(fileURLToPath(import.meta.url))

export interface RssOptions {
  scale: string
  keep: boolean
  outDir: string | undefined
}

export interface RssResult {
  scale: string
  projectDir: string
  reportFile: string
  rssBefore: number
  rssPeak: number
  rssAfter: number
  parentPeak: number
  diskBytes: number
  diskFiles: number
  payloadBytes: number
  markdown: string
}

interface WorkerRss {
  phases: Record<string, number>
  boundaries: Record<string, number>
  syncStartEpoch: number
  rssBefore: number
  rssPeak: number
  rssAfter: number
  payload: Record<string, number>
}

function isWorkerRss(value: unknown): value is WorkerRss {
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

function censusDir(dir: string, skip: Set<string>): { files: number; bytes: number } {
  let files = 0
  let bytes = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      const sub = censusDir(full, skip)
      files += sub.files
      bytes += sub.bytes
    } else if (entry.isFile()) {
      files += 1
      bytes += statSync(full).size
    }
  }
  return { files, bytes: bytes }
}

function mib(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}

function kb(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`
}

interface RssTimeline {
  epoch: number
  rss: number
}

async function runRssSync(projectDir: string, workDir: string): Promise<{ parsed: WorkerRss; timeline: RssTimeline[] }> {
  const goFile = join(workDir, 'go')
  writeFileSync(goFile, 'go\n')
  const worker = spawn(process.execPath, [join(HERE, 'worker-phases.ts'), projectDir, '25', goFile], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (!worker.pid) throw new Error('failed to spawn phased worker')
  const pid = worker.pid
  let stdout = ''
  let stderr = ''
  worker.stdout.on('data', (c: Buffer) => {
    stdout += c.toString('utf-8')
  })
  worker.stderr.on('data', (c: Buffer) => {
    stderr += c.toString('utf-8')
  })
  const timeline: RssTimeline[] = []
  let alive = true
  worker.on('close', () => {
    alive = false
  })
  const done = new Promise<number>((resolve, reject) => {
    worker.on('error', reject)
    worker.on('close', (code) => resolve(code ?? -1))
  })
  while (alive && !stderr.includes('SYNC-DONE')) {
    const sample = parentRssKb(pid)
    if (sample !== null) timeline.push({ epoch: Date.now(), rss: sample * 1024 })
    await sleep(10)
  }
  const code = await done
  if (code !== 0) throw new Error(`phased worker exited with code ${code}: ${stderr.slice(-400)}`)
  const parsed: unknown = JSON.parse(stdout.trim()) as unknown
  if (!isWorkerRss(parsed)) throw new Error('phased worker printed a foreign shape')
  return { parsed, timeline }
}

interface RssContext {
  scale: string
  seed: number
  parsed: WorkerRss
  timeline: RssTimeline[]
  parentPeak: number
  disk: { files: number; bytes: number }
}

function boundaryRows(ctx: RssContext): string[] {
  const rows = ['| boundary | RSS | Δ since start |', '| --- | --- | --- |']
  for (const stage of ['config', 'fragments.prepare', 'fragments.evaluate', 'native.compile', 'publish']) {
    const edge = ctx.parsed.syncStartEpoch + (ctx.parsed.boundaries[stage] ?? 0)
    const hit = ctx.timeline.find((s) => s.epoch >= edge) ?? ctx.timeline[ctx.timeline.length - 1]
    if (!hit) {
      rows.push(`| \`${stage}\` | — | — |`)
    } else {
      rows.push(`| \`${stage}\` | ${mib(hit.rss)} | +${mib(hit.rss - ctx.parsed.rssBefore)} |`)
    }
  }
  return rows
}

function payloadRows(payload: Record<string, number>, total: number): string[] {
  const rows = ['| field | bytes | share of payload |', '| --- | --- | --- |']
  const fields = Object.entries(payload)
    .filter(([key]) => key !== '(total-json)')
    .sort((a, b) => (b[1] as number) - (a[1] as number))
  for (const [key, bytes] of fields) {
    rows.push(`| \`${key}\` | ${kb(bytes as number)} | ${(((bytes as number) / total) * 100).toFixed(1)}% |`)
  }
  return rows
}

function renderRssMarkdown(ctx: RssContext): string {
  const syncMs = ctx.parsed.phases['sync.total'] ?? 0
  const payloadTotal = ctx.parsed.payload['(total-json)'] ?? 0
  const lines: string[] = []
  lines.push(`## RSS attribution — ${ctx.scale} (seed ${ctx.seed})`, '')
  lines.push(`- sync wall: ${syncMs.toFixed(0)}ms · worker peak ${mib(ctx.parsed.rssPeak)} · parent-polled peak ${mib(ctx.parentPeak)} (${ctx.timeline.length} samples)`)
  lines.push(`- repo on disk: ${ctx.disk.files} files, ${kb(ctx.disk.bytes)} · N-API payload JSON: ${kb(payloadTotal)}`)
  lines.push('')
  lines.push('### growth by stage boundary (parent-polled RSS)', '')
  lines.push(...boundaryRows(ctx))
  lines.push('')
  lines.push('### retention model at peak (approximate)', '')
  const growth = ctx.parentPeak - ctx.parsed.rssBefore
  const texts = ctx.disk.bytes * 2
  const payload = Math.round(payloadTotal * 2.5)
  const residual = growth - texts - payload
  lines.push('| holder | model | bytes | share of growth |', '| --- | --- | --- | --- |')
  lines.push(`| source texts (RS + TS copies) ≈ | 2 × disk | ${mib(texts)} | ${((texts / growth) * 100).toFixed(1)}% |`)
  lines.push(`| N-API payload (string + parsed) ≈ | 2.5 × JSON | ${mib(payload)} | ${((payload / growth) * 100).toFixed(1)}% |`)
  lines.push(`| arenas / AST / constants / overhead (residual) | remainder | ${mib(residual)} | ${((residual / growth) * 100).toFixed(1)}% |`)
  lines.push(`| baseline (pre-sync heap + runtime) | measured | ${mib(ctx.parsed.rssBefore)} | — |`)
  lines.push('')
  lines.push(`growth above baseline: ${mib(growth)} · residual per file: ${kb(Math.round(residual / Math.max(1, ctx.disk.files)))}`)
  lines.push('')
  lines.push('### N-API payload fields (measured bytes)', '')
  lines.push(...payloadRows(ctx.parsed.payload, payloadTotal))
  return lines.join('\n')
}

export interface RunAttribution {
  scale: string
  seed: number
  parsed: WorkerRss
  timeline: RssTimeline[]
  projectDir: string
  workDir: string
}

export function attributeFromRun(run: RunAttribution): {
  markdown: string
  reportFile: string
  parentPeak: number
  disk: { files: number; bytes: number }
  payloadTotal: number
} {
  const parentPeak = run.timeline.reduce((n, s) => Math.max(n, s.rss), 0)
  const disk = censusDir(run.projectDir, new Set(['node_modules', '.reference-ui']))
  const payloadTotal = run.parsed.payload['(total-json)'] ?? 0
  const markdown = renderRssMarkdown({
    scale: run.scale,
    seed: run.seed,
    parsed: run.parsed,
    timeline: run.timeline,
    parentPeak,
    disk,
  })
  const reportFile = join(run.workDir, `rss-${run.scale}.md`)
  writeFileSync(reportFile, `${markdown}\n`, 'utf-8')
  writeFileSync(
    join(run.workDir, `rss-${run.scale}.json`),
    `${JSON.stringify({ scale: run.scale, phases: run.parsed.phases, rss: { before: run.parsed.rssBefore, peak: run.parsed.rssPeak, after: run.parsed.rssAfter, parentPeak }, disk, payload: run.parsed.payload }, null, 2)}\n`,
    'utf-8',
  )
  return { markdown, reportFile, parentPeak, disk, payloadTotal }
}

export async function rss(options: RssOptions): Promise<RssResult> {
  const plan = resolvePlan(options.scale, {})
  const projectDir = mkdtempSync(join(tmpdir(), 'deepsee-rss-'))
  const workDir = options.outDir ?? mkdtempSync(join(tmpdir(), 'deepsee-rsswork-'))
  mkdirSync(workDir, { recursive: true })
  try {
    const generated = generateRepo(plan, projectDir)
    console.log(
      `[deepsee] ${plan.scale}: ${generated.styleFiles} files, ${generated.cssCalls} css() calls, seed ${plan.seed}`,
    )
    const { parsed, timeline } = await runRssSync(projectDir, workDir)
    const { markdown, reportFile, parentPeak, disk, payloadTotal } = attributeFromRun({
      scale: plan.scale,
      seed: plan.seed,
      parsed,
      timeline,
      projectDir,
      workDir,
    })
    return {
      scale: plan.scale,
      projectDir,
      reportFile,
      rssBefore: parsed.rssBefore,
      rssPeak: parsed.rssPeak,
      rssAfter: parsed.rssAfter,
      parentPeak,
      diskBytes: disk.bytes,
      diskFiles: disk.files,
      payloadBytes: payloadTotal,
      markdown,
    }
  } finally {
    if (options.keep) {
      console.log(`[deepsee] kept repo at ${projectDir}`)
    } else {
      rmSync(projectDir, { recursive: true, force: true })
    }
  }
}
