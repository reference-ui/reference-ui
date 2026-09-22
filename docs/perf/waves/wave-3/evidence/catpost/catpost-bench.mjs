// Timed A/B probe: category-browse latency. Imports the worktree module
// (arm file swapped by the outer loop). Prints one JSON line.
import { performance } from 'node:perf_hooks'

const W = '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-934a-7590-a7b8-c75ef40b84c6'
const t0 = performance.now()
const { searchEngine } = await import(`${W}/packages/reference-mcp/src/pipeline/icons-search-index.ts`)
const loadMs = performance.now() - t0

const cats = searchEngine.categories
const limits = [10, 25, 100]
const N_WARM = 100
const N = 600

let k = 0
const one = () => {
  const c = cats[k % cats.length]
  const limit = limits[k % limits.length]
  const verbose = k % 2 === 0
  k++
  return searchEngine.search({ category: c, limit, verbose })
}
for (let i = 0; i < N_WARM; i++) one()

const ts = []
for (let i = 0; i < N; i++) {
  const s = performance.now()
  one()
  ts.push((performance.now() - s) * 1000) // us per call
}
ts.sort((a, b) => a - b)
const q = p => ts[Math.min(N - 1, Math.floor(p * N))]
const mean = ts.reduce((a, b) => a + b, 0) / N
console.log(JSON.stringify({
  loadMs: +loadMs.toFixed(2),
  medianUs: +q(0.5).toFixed(2),
  p95Us: +q(0.95).toFixed(2),
  meanUs: +mean.toFixed(2),
}))
