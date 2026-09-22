// Single-sync child worker for Neo benchmarks.
// It takes a project dir plus a sample interval and emits one JSON line.
// RSS sampling runs on an interval around sync(), so the peak reflects the compile itself.
// The parent spawns one fresh worker per run: every RSS baseline starts cold.
// Scorer bench-worker/2 also reports the OS high-water (getrusage maxrss),
// which the kernel maintains independently of this thread's blocked event loop.

import { performance } from 'node:perf_hooks'
import { sync } from '../../src/sync/index.ts'
import { markPhase, markPhaseAt, writePhasesFile } from '../../src/sync/phases.ts'

const SCORER = 'bench-worker/2'

interface WorkerArgs {
  dir: string
  sampleMs: number
}

function parseArgs(argv: string[]): WorkerArgs {
  const dir = argv[2]
  if (!dir) throw new Error('usage: worker.ts <project-dir> <sample-ms>')
  const sampleMs = Number(argv[3])
  if (!Number.isFinite(sampleMs) || sampleMs < 1) {
    throw new Error(`invalid sample interval: ${argv[3] ?? '(none)'}`)
  }
  return { dir, sampleMs }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv)
  // Phase anchors for same-run attribution (agentrs-phases/1): processStart
  // is the V8 origin so module load folds into the measured startup phase.
  // All three calls no-op unless REFERENCE_UI_PHASES_OUT is set.
  markPhaseAt('processStart', performance.timeOrigin, 0)
  markPhase('workerMain')
  const rssBefore = process.memoryUsage().rss
  let rssPeak = rssBefore
  const sampler = setInterval(() => {
    const current = process.memoryUsage().rss
    if (current > rssPeak) rssPeak = current
  }, args.sampleMs)
  sampler.unref()
  const started = performance.now()
  try {
    await sync(args.dir)
  } finally {
    markPhase('workerEnd')
    clearInterval(sampler)
  }
  const syncMs = performance.now() - started
  const rssAfter = process.memoryUsage().rss
  if (rssAfter > rssPeak) rssPeak = rssAfter
  // Lifetime OS high-water in bytes: resourceUsage maxRSS is KiB (libuv
  // normalizes; probed on darwin/x64: fresh node 32656 ≈ 33.4MB rss).
  // Read after the seal; monotonic, so post-sync timing cannot move it.
  const rssPeakHw = process.resourceUsage().maxRSS * 1024
  // After the sample is sealed so the file write cannot perturb syncMs.
  writePhasesFile()
  console.log(JSON.stringify({ syncMs, rssBefore, rssPeak, rssAfter, rssPeakHw, scorer: SCORER }))
}

try {
  await main()
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
}
