import { IconsSearchEngine } from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c88b-c8fb-7600-94d2-00ae83459eab/packages/reference-mcp/src/pipeline/icons-search-index.ts'
import rawIndex from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c88b-c8fb-7600-94d2-00ae83459eab/packages/reference-mcp/src/data/icons-index.json' with { type: 'json' }
const engine = new IconsSearchEngine(rawIndex)
const N = 500
for (let i = 0; i < 20; i++) engine.searchDemand(`warmup-${i}`, 5) // warmup
const t0 = process.hrtime.bigint()
for (let i = 0; i < N; i++) engine.searchDemand(`missprobe-${i}-zxq`, 5) // every key unique -> always miss
const t1 = process.hrtime.bigint()
console.log(`all-miss: total=${(Number(t1-t0)/1e6).toFixed(2)}ms per-op=${(Number(t1-t0)/1e6/N*1000).toFixed(2)}us size=${engine.demandCache?.size ?? 'n/a'}`)
