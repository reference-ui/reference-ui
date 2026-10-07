// Fresh-process sample runner for the voyage-one-shot harness.
// It takes a harness mode, a package dir, and a sample count, runs the
// measure-one-shot harness once per fresh process, then reports per-field
// medians and an agreement count (samples within ±5% of the median).
//
// Usage: node run-samples.mjs <sync|config> <pkgDir> <count> [outJson]
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('../../../../', import.meta.url).pathname.replace(/\/$/, '')
const harness = join(ROOT, '.agents/missions/voyage-one-shot/scripts/measure-one-shot.mjs')
const [mode, pkgDir, countArg, outJson] = process.argv.slice(2)
const count = Number(countArg ?? 8)

const samples = []
for (let i = 0; i < count; i++) {
  const stdout = execFileSync(process.execPath, [harness, mode, pkgDir], { cwd: ROOT, encoding: 'utf8' })
  samples.push(JSON.parse(stdout))
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

// Pull the scalar fields (sync phases are nested under `.phases`).
const fields = new Map()
for (const s of samples) {
  const flat = mode === 'sync' ? { ...s.phases, atomicMs: s.atomicMs, drainMs: s.drainMs } : s
  for (const [k, v] of Object.entries(flat)) {
    if (typeof v !== 'number') continue
    if (!fields.has(k)) fields.set(k, [])
    fields.get(k).push(v)
  }
}

const stats = {}
for (const [k, values] of fields) {
  const med = median(values)
  const tolerance = Math.abs(med) * 0.05
  const agree = values.filter((v) => Math.abs(v - med) <= tolerance).length
  stats[k] = { median: med, min: Math.min(...values), max: Math.max(...values), agreement: `${agree}/${values.length}` }
}

const result = { mode, pkgDir, count, samples, stats }
if (outJson) writeFileSync(outJson, `${JSON.stringify(result, null, 2)}\n`)
console.log(
  JSON.stringify(
    {
      mode,
      pkgDir,
      count,
      stats,
      samples: samples.map((s) => (mode === 'sync' ? { config: s.phases?.config, syncTotal: s.phases?.syncTotal, atomicMs: s.atomicMs, drainMs: s.drainMs } : s)),
    },
    null,
    2
  )
)
