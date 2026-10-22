// heap-retention.spec.ts — spec for CORE-WATCH-32, the watch heap-retention case. Takes { case } from the
// runner with the world synced standalone. It syncs the big upstream, points the world at it, then spawns a
// real `ref sync --watch` under --expose-gc with heap-probe.cjs preloaded, and drives resyncs of the unchanged
// project with SIGUSR2 pokes, each waiting for its probe sample. Post-GC heap growth from the last warm-up
// resync to the last poke must stay under the budget. Emits nothing on success; throws naming the growth.
import { spawn, type ChildProcess } from 'node:child_process'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { CoreCase } from '../../../../shared/cases.ts'
import type { SpecPage } from '../../../../shared/page.ts'
import { sync } from '../../../../../src/sync/index.ts'

interface SpecInput {
  page: SpecPage
  case: CoreCase
}

interface Sample {
  sync: number
  heap: number
}

const WARMUP = 5
const POKES = 40
const BUDGET_MB = 10
const BIG_BASE = '../upstreams/big/.reference-ui/system/baseSystem.mjs'
const MB = 1024 * 1024

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// The CLI entry, four levels above this case folder: tests/cases/watch/<ID>.
function refBinOf(caseDir: string): string {
  return path.resolve(caseDir, '..', '..', '..', '..', 'bin', 'ref.ts')
}

function toExtendedConfig(canonical: string): string {
  const extended = canonical
    .replace(
      "import { defineConfig } from '@reference-ui/core'",
      `import { defineConfig } from '@reference-ui/core'\nimport { baseSystem as big } from '${BIG_BASE}'`,
    )
    .replace('extends: [],', 'extends: [big],')
  assert.notEqual(extended, canonical, 'canonical ui.config lost its core import or empty extends')
  return extended
}

function readSamples(probeOut: string): Sample[] {
  if (!fs.existsSync(probeOut)) return []
  return fs
    .readFileSync(probeOut, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Sample)
}

// Waits for the probe's sample of sync n; a resync is one native compile, so the budget is generous.
async function sampleOf(probeOut: string, n: number, child: ChildProcess, log: () => string): Promise<Sample> {
  const deadline = Date.now() + 60000
  for (;;) {
    const found = readSamples(probeOut).find((s) => s.sync === n)
    if (found) return found
    assert.equal(child.exitCode, null, `watch exited before sync ${n}:\n${log()}`)
    assert.ok(Date.now() < deadline, `timed out waiting for sync ${n}:\n${log()}`)
    await sleep(50)
  }
}

async function stopWatch(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) return
  const closed = new Promise<void>((resolve) => child.once('close', () => resolve()))
  child.kill('SIGINT')
  const killTimer = setTimeout(() => child.kill('SIGKILL'), 15000)
  await closed
  clearTimeout(killTimer)
}

async function measureRetention(c: CoreCase): Promise<{ warm: Sample; last: Sample }> {
  const probeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'core-watch-32-'))
  const probeOut = path.join(probeDir, 'heap.jsonl')
  const probe = path.join(c.dir, 'specs', 'heap-probe.cjs')
  const child = spawn(
    process.execPath,
    ['--expose-gc', '--require', probe, refBinOf(c.dir), 'sync', '--watch', c.worldDir],
    { cwd: c.worldDir, env: { ...process.env, CORE_WATCH_32_PROBE: probeOut }, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let output = ''
  child.stdout?.on('data', (chunk: Buffer) => { output += chunk.toString('utf8') })
  child.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString('utf8') })
  const log = (): string => output.slice(-4000)
  try {
    // The baseline sync is sample 1; warm-up pokes settle module caches and JIT before the measure.
    await sampleOf(probeOut, 1, child, log)
    let n = 1
    const poke = async (): Promise<Sample> => {
      n += 1
      child.kill('SIGUSR2')
      return sampleOf(probeOut, n, child, log)
    }
    let warm = await poke()
    for (let i = 1; i < WARMUP; i += 1) warm = await poke()
    let last = warm
    for (let i = 0; i < POKES; i += 1) last = await poke()
    return { warm, last }
  } finally {
    await stopWatch(child)
    fs.rmSync(probeDir, { recursive: true, force: true })
  }
}

export default async function run({ case: c }: SpecInput): Promise<void> {
  if (process.platform === 'win32') return
  const configPath = path.join(c.worldDir, 'ui.config.ts')
  const canonical = fs.readFileSync(configPath, 'utf8')
  await sync(path.join(c.dir, 'upstreams', 'big'))
  fs.writeFileSync(configPath, toExtendedConfig(canonical), 'utf8')
  try {
    await sync(c.worldDir)
    const { warm, last } = await measureRetention(c)
    const growthMb = (last.heap - warm.heap) / MB
    console.log(
      `[CORE-WATCH-32] heap after warm-up ${(warm.heap / MB).toFixed(1)} MB, after ${POKES} pokes ` +
        `${(last.heap / MB).toFixed(1)} MB, growth ${growthMb.toFixed(1)} MB`,
    )
    assert.ok(growthMb < BUDGET_MB, `${POKES} resyncs of an unchanged project retained ${growthMb.toFixed(1)} MB (budget ${BUDGET_MB} MB)`)
  } finally {
    fs.writeFileSync(configPath, canonical, 'utf8')
    await sync(c.worldDir)
  }
}
