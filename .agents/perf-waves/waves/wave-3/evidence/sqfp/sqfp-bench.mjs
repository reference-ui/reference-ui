import rawIndex from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c880-8f31-70a2-81be-9c0d486d6061/packages/reference-mcp/src/data/icons-index.json' with { type: 'json' }
import { IconsSearchEngine } from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c880-8f31-70a2-81be-9c0d486d6061/packages/reference-mcp/src/pipeline/icons-search-index.ts'

const engine = new IconsSearchEngine(rawIndex)

const singles = [
  'trash', 'search', 'magnifying glass', 'pencil', 'cross', 'seach', 'setings',
  'arrow', 'user settings', 'shopping cart', 'logout', 'gear', 'home', 'menu',
  'close', 'delete', 'edit', 'v2.0', 'x', 'a', '24px rounded',
]
const multis = [
  'I need an icon for user settings, a shopping cart, and a trash can for deletion',
  'can you find trash and search icons?',
  'trash, search; home\nmenu',
  'the trash icon',
  'a search icon for settings',
  'icons for home and menu',
  'I am building a dashboard. I need trash and search.',
  'bullets • separated • items',
  '- dashed list\n- of items',
]
const arrays = [['shopping cart', 'trash', 'gear'], ['a', ''], []]

function benchExtract(queries, iters) {
  for (const q of queries) engine.extractDemands(q) // warm
  const t0 = performance.now()
  for (let i = 0; i < iters; i++) {
    for (const q of queries) engine.extractDemands(q)
  }
  const t1 = performance.now()
  return (t1 - t0) / (iters * queries.length) * 1e6 // ns per call
}

function benchSearch(queries, iters) {
  for (const q of queries) engine.search({ query: q }) // warm
  const t0 = performance.now()
  for (let i = 0; i < iters; i++) {
    for (const q of queries) engine.search({ query: q })
  }
  const t1 = performance.now()
  return (t1 - t0) / (iters * queries.length) * 1e6 // ns per call
}

// Equivalence snapshot
const snap = {}
for (const q of [...singles, ...multis]) snap['q:' + q] = engine.extractDemands(q)
for (const a of arrays) snap['a:' + JSON.stringify(a)] = engine.extractDemands(a)
for (const q of [...singles, ...multis]) {
  const r = engine.search({ query: q })
  snap['s:' + q] = JSON.stringify(r)
}
await import('node:fs').then(fs =>
  fs.writeFileSync(process.argv[2] || '/tmp/sqfp-snap.json', JSON.stringify(snap, null, 1))
)

// Timed runs: 5 reps
const exS = [], exM = [], seS = []
for (let r = 0; r < 5; r++) {
  exS.push(benchExtract(singles, 2000))
  exM.push(benchExtract(multis, 2000))
  seS.push(benchSearch(singles, 200))
}
const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)]
console.log(JSON.stringify({
  extractSingleNs: { runs: exS.map(Math.round), med: Math.round(med(exS)) },
  extractMultiNs: { runs: exM.map(Math.round), med: Math.round(med(exM)) },
  searchSingleNs: { runs: seS.map(Math.round), med: Math.round(med(seS)) },
}, null, 1))
