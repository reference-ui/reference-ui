// Cost-split probe: replicates IconsSearchEngine constructor (icons-search-index.ts:80-108)
// + JSON import parse, using the worktree's real 5.27MB index and parent's minisearch.
// Usage: node /tmp/icons-cost-split.mjs <path-to-icons-index.json> <reps>
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire('/Users/ryn/Developer/reference-ui/packages/reference-mcp/node_modules/minisearch/package.json')
const MiniSearch = require('minisearch')

const jsonPath = process.argv[2]
const reps = Number(process.argv[3] || 5)

const MINI_SEARCH_CONFIG = {
  fields: ['canonical', 'name', 'slug', 'primarySynonyms', 'tags', 'description'],
  storeFields: ['name', 'description', 'categories'],
  searchOptions: {
    boost: { canonical: 30, primarySynonyms: 15, name: 8, slug: 6, tags: 3, description: 1 },
    fuzzy: term => (term.length > 3 ? 0.2 : false),
    prefix: true,
  },
}

function median(a) {
  const s = [...a].sort((x, y) => x - y)
  return s[Math.floor(s.length / 2)]
}

const t = { read: [], parse: [], stringify: [], loadJSON: [], catscan: [] }
let docCount = 0
let catCount = 0
for (let i = 0; i < reps; i++) {
  let s = performance.now()
  const text = readFileSync(jsonPath, 'utf8')
  t.read.push(performance.now() - s)

  s = performance.now()
  const rawIndex = JSON.parse(text) // ~= `import ... with { type: 'json' }` parse at import
  t.parse.push(performance.now() - s)

  // --- constructor body begins (icons-search-index.ts:80-108) ---
  s = performance.now()
  const jsonString = JSON.stringify(rawIndex)
  t.stringify.push(performance.now() - s)

  s = performance.now()
  const miniSearch = MiniSearch.loadJSON(jsonString, {
    fields: MINI_SEARCH_CONFIG.fields,
    storeFields: MINI_SEARCH_CONFIG.storeFields,
    searchOptions: MINI_SEARCH_CONFIG.searchOptions,
  })
  t.loadJSON.push(performance.now() - s)

  s = performance.now()
  const catSet = new Set()
  const docs = miniSearch._storedFields
  if (docs && docs instanceof Map) {
    for (const entry of docs.values()) {
      if (Array.isArray(entry.categories)) for (const c of entry.categories) if (c) catSet.add(c)
    }
  }
  const categories = Array.from(catSet).sort()
  t.catscan.push(performance.now() - s)
  // --- constructor body ends ---
  docCount = miniSearch.documentCount
  catCount = categories.length
}

const med = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, +median(v).toFixed(2)]))
const eagerImportTotal = med.parse + med.stringify + med.loadJSON + med.catscan
console.log(JSON.stringify({ reps, docCount, catCount, medians_ms: med, eagerImportTotal_ms: +eagerImportTotal.toFixed(2) }))
