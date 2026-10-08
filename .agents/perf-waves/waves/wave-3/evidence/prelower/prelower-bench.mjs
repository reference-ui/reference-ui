import { IconsSearchEngine } from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-8efa-79d2-86f8-99b5932a379f/packages/reference-mcp/src/pipeline/icons-search-index.ts'
import rawIndex from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-8efa-79d2-86f8-99b5932a379f/packages/reference-mcp/src/data/icons-index.json' with { type: 'json' }

const engine = new IconsSearchEngine(rawIndex)

function med(a) {
  const s = [...a].sort((x, y) => x - y)
  return s[s.length >> 1]
}

// Census: count String.prototype.toLowerCase calls during one category browse
function countLowers(fn) {
  const orig = String.prototype.toLowerCase
  let n = 0
  String.prototype.toLowerCase = function () {
    n++
    return orig.call(this)
  }
  try {
    fn()
  } finally {
    String.prototype.toLowerCase = orig
  }
  return n
}

const browseLowers = countLowers(() => engine.search({ category: 'navigation', limit: 25 }))
const demandLowers = countLowers(() => engine.searchDemand('trash can', 5, 'action'))
console.log(`lowersPerCategoryBrowse=${browseLowers} lowersPerSearchDemand=${demandLowers}`)

// Timed: interleaved A/B rounds, medians of per-op ms
function timeOp(fn, iters) {
  const ts = []
  for (let i = 0; i < iters; i++) {
    const t0 = process.hrtime.bigint()
    fn()
    ts.push(Number(process.hrtime.bigint() - t0) / 1e6)
  }
  return med(ts)
}

const browseFns = [
  () => engine.search({ category: 'navigation', limit: 25 }),
  () => engine.search({ category: 'action', limit: 25 }),
  () => engine.search({ category: 'editor', limit: 25 }),
  () => engine.search({ category: 'maps', limit: 25 }),
]
const demandFns = [
  () => engine.searchDemand('trash can', 5, 'action'),
  () => engine.searchDemand('user settings', 5, 'action'),
  () => engine.searchDemand('magnifying glass', 5, 'search'),
  () => engine.searchDemand('shopping cart', 5, 'action'),
]

// warmup
for (let i = 0; i < 20; i++) {
  browseFns[i % 4]()
  demandFns[i % 4]()
}

const rounds = 6
const browseMeds = []
const demandMeds = []
for (let r = 0; r < rounds; r++) {
  browseMeds.push(timeOp(() => browseFns[r % 4](), 50))
  demandMeds.push(timeOp(() => demandFns[r % 4](), 50))
}
console.log(`browseMedianMs=${med(browseMeds).toFixed(4)} [${browseMeds.map(v => v.toFixed(3)).join(',')}]`)
console.log(`demandMedianMs=${med(demandMeds).toFixed(4)} [${demandMeds.map(v => v.toFixed(3)).join(',')}]`)
// identity hash of outputs
import { createHash } from 'node:crypto'
const h = createHash('sha256')
for (const c of ['navigation', 'action', 'editor', 'maps', 'search', 'NAVIGATION', 'Action']) {
  h.update(JSON.stringify(engine.search({ category: c, limit: 25 })))
  h.update(JSON.stringify(engine.search({ category: c, limit: 10, verbose: true })))
}
for (const [q, c] of [['trash can', 'action'], ['trash can', 'ACTION'], ['user settings', 'social'], ['x', undefined]]) {
  h.update(JSON.stringify(engine.searchDemand(q, 5, c)))
  h.update(JSON.stringify(engine.searchDemand(q, 5, c, true)))
}
console.log(`identity=${h.digest('hex').slice(0, 16)}`)
