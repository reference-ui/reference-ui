import { writeFileSync } from 'node:fs'

// Baseline census: untimed characterization of the category-browse path.
const mod = await import(
  '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-934a-7590-a7b8-c75ef40b84c6/packages/reference-mcp/src/pipeline/icons-search-index.ts'
)
const { searchEngine } = mod

console.log('documentCount:', searchEngine.documentCount)
console.log('categories:', JSON.stringify(searchEngine.categories))

// Census: per-category totals via the browse path
const counts = {}
for (const c of searchEngine.categories) {
  const r = searchEngine.search({ category: c, limit: 100 })
  counts[c] = { total: r.total, returned: r.returned }
}
console.log('per-category (total/returned@limit100):', JSON.stringify(counts, null, 1))

// Order probe: first 5 names for a mid-size category
const nav = searchEngine.search({ category: 'navigation', limit: 100 })
console.log('navigation first5:', nav.icons.slice(0, 5).map(i => i.name).join(','))
console.log('navigation total:', nav.total)

// Multi-category membership check: any doc whose categories[0] !== matched category?
import MiniSearch from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-934a-7590-a7b8-c75ef40b84c6/packages/reference-mcp/node_modules/minisearch/dist/es/index.js'
const stored = searchEngine.miniSearch._storedFields
let multi = 0, total = 0
for (const e of stored.values()) { total++; if (e.categories && e.categories.length > 1) multi++ }
console.log(`stored docs: ${total}, multi-category docs: ${multi}`)

// Wildcard order vs _storedFields order: is browse order == insertion order?
const wild = searchEngine.miniSearch.search(MiniSearch.wildcard, {})
const wildNames = wild.map(r => r.name)
const storedNames = [...stored.values()].map(e => e.name)
let sameOrder = wildNames.length === storedNames.length
if (sameOrder) {
  for (let i = 0; i < wildNames.length; i++) {
    if (wildNames[i] !== storedNames[i]) { sameOrder = false; break }
  }
}
console.log('wildcard order == _storedFields insertion order:', sameOrder)
if (!sameOrder) {
  console.log('wild first5:', wildNames.slice(0, 5).join(','))
  console.log('stored first5:', storedNames.slice(0, 5).join(','))
  // check whether wildcard order is a stable permutation (score desc?)
  const scores = wild.slice(0, 10).map(r => r.score)
  console.log('wild top10 scores:', JSON.stringify(scores))
}

// Identity snapshot cases (saved for byte-compare after diet)
const cases = {}
for (const c of [...searchEngine.categories, 'nonexistent-cat']) {
  cases[`cat:${c}:l25`] = searchEngine.search({ category: c, limit: 25 })
  cases[`cat:${c}:l100v`] = searchEngine.search({ category: c, limit: 100, verbose: true })
}
cases['edge:blank-demands'] = searchEngine.search({ demands: ['  '] })
cases['edge:blank-demands-v'] = searchEngine.search({ demands: ['  '], verbose: true, limit: 100 })
cases['edge:upper-cat'] = searchEngine.search({ category: 'NAVIGATION', limit: 25 })
cases['sanity:query-trash'] = searchEngine.search({ query: 'trash' })
writeFileSync('/tmp/catpost-baseline.json', JSON.stringify(cases))
console.log('snapshot cases:', Object.keys(cases).length, 'written to /tmp/catpost-baseline.json')
