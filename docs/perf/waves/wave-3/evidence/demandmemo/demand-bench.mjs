import { IconsSearchEngine } from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-977b-7ee3-8430-2042be652567/packages/reference-mcp/src/pipeline/icons-search-index.ts'
import rawIndex from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-977b-7ee3-8430-2042be652567/packages/reference-mcp/src/data/icons-index.json' with { type: 'json' }

const engine = new IconsSearchEngine(rawIndex)
console.log('docs:', engine.documentCount)

function bench(name, fn, iters = 2000, warmup = 200) {
  for (let i = 0; i < warmup; i++) fn(i)
  const ts = []
  for (let i = 0; i < iters; i++) {
    const t0 = performance.now()
    fn(i)
    ts.push(performance.now() - t0)
  }
  ts.sort((a, b) => a - b)
  const mean = ts.reduce((a, b) => a + b, 0) / ts.length
  const med = ts[Math.floor(ts.length / 2)]
  const p95 = ts[Math.floor(ts.length * 0.95)]
  console.log(`${name}: iters=${iters} mean=${(mean * 1000).toFixed(1)}us med=${(med * 1000).toFixed(1)}us p95=${(p95 * 1000).toFixed(1)}us`)
  return { mean, med, p95 }
}

// A) repeated identical demand (memo hit path after lever)
bench('A repeat-same-demand', () => engine.searchDemand('trash', 5, undefined, false))

// B) multi-demand batch with duplicates (dup demands within one search() call)
const dupDemands = ['shopping cart', 'trash', 'shopping cart', 'trash', 'gear', 'gear']
bench(
  'B batch-with-dups(6,3uniq)',
  () => engine.search({ demands: dupDemands }),
  500,
  50
)

// C) unique demands (miss path / LRU overhead)
const uniq = ['trash', 'cart', 'gear', 'arrow', 'search', 'user', 'home', 'settings', 'logout', 'menu', 'close', 'edit', 'delete', 'add', 'remove', 'check', 'cancel', 'send', 'share', 'download']
bench('C unique-cycle(20)', i => engine.searchDemand(uniq[i % uniq.length], 5, undefined, false))

// D) single-demand end-to-end via search()
bench('D search-single', () => engine.search({ query: 'trash' }), 1000, 100)

// Correctness: determinism check across repeated calls
const r1 = JSON.stringify(engine.searchDemand('trash', 5, undefined, false))
const r2 = JSON.stringify(engine.searchDemand('trash', 5, undefined, false))
console.log('determinism repeat-call identical:', r1 === r2)
const v1 = JSON.stringify(engine.searchDemand('trash', 5, undefined, true))
const v2 = JSON.stringify(engine.searchDemand('trash', 5, undefined, true))
console.log('determinism verbose identical:', v1 === v2)
console.log('verbose differs from lean:', v1 !== r1)
