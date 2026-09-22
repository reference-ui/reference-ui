import { writeFileSync } from 'node:fs'
import { DEMANDS, loadEngine, benchSearch, snapshot } from './pretrim-harness.mjs'

const WT = '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c884-7024-79f1-906d-b1b948b7baef'
const engine = await loadEngine(`${WT}/packages/reference-mcp/src/pipeline/icons-search-index.ts`, `${WT}/packages/reference-mcp/src/data/icons-index.json`)
console.log('docCount', engine.documentCount)

// result-count census: how many results per call actually hit trim slow path
let nRes = 0
for (const d of DEMANDS) {
  const r = engine.searchDemand(d, 5)
  nRes += r.icons.length
}
console.log('demands', DEMANDS.length, 'total results @limit5', nRes)

// bench: 3 reps
for (let rep = 0; rep < 3; rep++) {
  const b = benchSearch(engine, 120)
  console.log(`rep${rep}: totalMs=${b.totalMs.toFixed(1)} calls=${b.calls} usPerCall=${b.usPerCall.toFixed(2)}`)
}

// snapshot for equivalence
const snap = snapshot(engine)
writeFileSync('/tmp/pretrim-snap-base.json', JSON.stringify(snap))
console.log('wrote /tmp/pretrim-snap-base.json', Object.keys(snap).length, 'keys')

// microbench trimDescription alone over real result descriptions
function trimDescription(desc, maxLen = 220) {
  if (!desc || desc.length <= maxLen) return desc
  const periodIdx = desc.indexOf('. ', 80)
  if (periodIdx !== -1 && periodIdx <= maxLen) return desc.slice(0, periodIdx + 1)
  const trimmed = desc.slice(0, maxLen)
  const lastSpace = trimmed.lastIndexOf(' ')
  return (lastSpace > 60 ? trimmed.slice(0, lastSpace) : trimmed) + '...'
}
const descs = []
for (const d of DEMANDS) for (const i of engine.searchDemand(d, 25).icons) descs.push(i.description)
// need FULL descriptions: re-derive from stored fields via raw search
const rawRes = engine.miniSearch.search('icon', { prefix: false })
console.log('sample stored desc len p50 check:', rawRes.slice(0, 5).map(r => String(r.description).length))
const fullDescs = engine.miniSearch.search('the', {}).slice(0, 500).map(r => String(r.description || ''))
const t0 = performance.now()
const N = 20000
for (let i = 0; i < N; i++) for (const d of fullDescs) trimDescription(d)
const t1 = performance.now()
console.log(`trimDescription micro: ${(fullDescs.length * N)} calls in ${(t1 - t0).toFixed(1)}ms = ${(((t1 - t0) * 1e6) / (fullDescs.length * N)).toFixed(1)}ns/call`)
