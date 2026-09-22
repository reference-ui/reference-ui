// demand-memo probe: measures MiniSearch.searchDemand repeat cost.
// Usage: node /tmp/demand-memo-bench.mjs [repeats]
import { IconsSearchEngine } from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c88b-c8fb-7600-94d2-00ae83459eab/packages/reference-mcp/src/pipeline/icons-search-index.ts'
import rawIndex from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c88b-c8fb-7600-94d2-00ae83459eab/packages/reference-mcp/src/data/icons-index.json' with { type: 'json' }

const engine = new IconsSearchEngine(rawIndex)
const N = Number(process.argv[2] ?? 2000)

function bench(label, fn, iters) {
  // warmup (unscored)
  for (let i = 0; i < 50; i++) fn(i)
  const t0 = process.hrtime.bigint()
  for (let i = 0; i < iters; i++) fn(i)
  const t1 = process.hrtime.bigint()
  const totalMs = Number(t1 - t0) / 1e6
  console.log(`${label}: total=${totalMs.toFixed(2)}ms iters=${iters} per-op=${(totalMs / iters * 1000).toFixed(2)}us`)
  return totalMs
}

// 1) cold single-demand cost (distinct demands => no reuse possible)
const distinctPool = ['trash', 'shopping cart', 'user settings', 'search magnifier', 'arrow navigation', 'gear configuration', 'logout door', 'calendar date', 'camera photo', 'heart favorite']
bench('distinct-10cycle ', i => engine.searchDemand(distinctPool[i % distinctPool.length], 5), N)

// 2) hot repeat: SAME demand every call (the lever's target: repeated demands)
bench('repeat-1demand ', () => engine.searchDemand('shopping cart', 5), N)

// 3) hot repeat with category + verbose (key must include them)
bench('repeat-1catverb', () => engine.searchDemand('trash', 5, 'action', true), N)

// 4) multi-demand search() with duplicate demands in one call
bench('dup-batch     ', () => engine.search({ demands: ['trash', 'trash', 'trash'] }), Math.floor(N / 10))

// ---- correctness probes ----
const a = JSON.stringify(engine.searchDemand('trash', 5))
const b = JSON.stringify(engine.searchDemand('trash', 5))
console.log('repeat-identical:', a === b)
const c = JSON.stringify(engine.searchDemand('trash', 2))
console.log('limit-separates:', a !== c)
const d = JSON.stringify(engine.searchDemand('trash', 5, 'action'))
console.log('category-separates:', a !== d)
const e = JSON.stringify(engine.searchDemand('trash', 5, undefined, true))
console.log('verbose-separates:', a !== e)
const f = JSON.stringify(engine.searchDemand('  trash  ', 5))
console.log('trim-normalized:', a === f)
console.log('cache-size:', engine.demandCache?.size ?? 'n/a (no cache)')
// eviction + identity probes
const fresh1 = engine.searchDemand('trash', 5)
const fresh2 = engine.searchDemand('trash', 5)
console.log('hit-same-ref:', fresh1 === fresh2)
for (let i = 0; i < 80; i++) engine.searchDemand(`evict-probe-${i}`, 5)
console.log('cap-respected:', (engine.demandCache?.size ?? 0) <= 64, 'size=', engine.demandCache?.size)
