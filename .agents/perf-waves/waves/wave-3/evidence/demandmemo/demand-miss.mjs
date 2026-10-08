import { IconsSearchEngine } from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-977b-7ee3-8430-2042be652567/packages/reference-mcp/src/pipeline/icons-search-index.ts'
import rawIndex from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-977b-7ee3-8430-2042be652567/packages/reference-mcp/src/data/icons-index.json' with { type: 'json' }

const engine = new IconsSearchEngine(rawIndex)

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
  console.log(`${name}: iters=${iters} mean=${(mean * 1000).toFixed(1)}us med=${(ts[Math.floor(ts.length / 2)] * 1000).toFixed(1)}us p95=${(ts[Math.floor(ts.length * 0.95)] * 1000).toFixed(1)}us`)
}

// E) always-unique demands (never repeat; defeats 64-entry cache) -> miss-path overhead
bench('E always-unique-miss', i => engine.searchDemand(`trash query ${i} ${i * 7919}`, 5, undefined, false))

// F) per-demand single-call cost (fresh engine each = cold, no cache help even after lever)
for (const d of ['trash', 'shopping cart', 'gear', 'user settings', 'magnifying glass', 'seach']) {
  const ts = []
  for (let i = 0; i < 200; i++) {
    const e = new IconsSearchEngine(rawIndex)
    const t0 = performance.now()
    e.searchDemand(d, 5, undefined, false)
    ts.push(performance.now() - t0)
  }
  ts.sort((a, b) => a - b)
  console.log(`F cold '${d}': med=${(ts[100] * 1000).toFixed(1)}us`)
}

// G) cold batch-with-dups on fresh engine (first-call cost, cache cannot help)
{
  const ts = []
  for (let i = 0; i < 100; i++) {
    const e = new IconsSearchEngine(rawIndex)
    const t0 = performance.now()
    e.search({ demands: ['shopping cart', 'trash', 'shopping cart', 'trash', 'gear', 'gear'] })
    ts.push(performance.now() - t0)
  }
  ts.sort((a, b) => a - b)
  console.log(`G cold-batch-dups: med=${(ts[50] * 1000).toFixed(1)}us`)
}
