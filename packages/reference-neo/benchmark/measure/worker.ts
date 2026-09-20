// Single-sync child worker for Neo benchmarks.
// It takes a project dir plus a sample interval and emits one JSON line.
// RSS sampling runs on an interval around sync(), so the peak reflects the compile itself.
// The parent spawns one fresh worker per run: every RSS baseline starts cold.

import { performance } from 'node:perf_hooks'
import { sync } from '../../src/sync/index.ts'

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
    clearInterval(sampler)
  }
  const syncMs = performance.now() - started
  const rssAfter = process.memoryUsage().rss
  if (rssAfter > rssPeak) rssPeak = rssAfter
  console.log(JSON.stringify({ syncMs, rssBefore, rssPeak, rssAfter }))
}

try {
  await main()
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
}
