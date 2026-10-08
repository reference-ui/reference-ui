// Component breakdown of the eager singleton cost (BEFORE version).
// Replicates IconsSearchEngine constructor step by step.
import { readFileSync } from 'node:fs'
import MiniSearch from 'minisearch'

const JSON_PATH = '/tmp/bench-icons/before/src/data/icons-index.json'
const FIELDS = ['canonical', 'name', 'slug', 'primarySynonyms', 'tags', 'description']
const STORE = ['name', 'description', 'categories']
const SEARCH_OPTS = {
  boost: { canonical: 30, primarySynonyms: 15, name: 8, slug: 6, tags: 3, description: 1 },
  fuzzy: term => (term.length > 3 ? 0.2 : false),
  prefix: true,
}

function med(a) {
  const s = [...a].sort((x, y) => x - y)
  return s[Math.floor(s.length / 2)]
}

const N = 9
const tRead = [], tParse = [], tStringify = [], tLoad = [], tCats = []
let raw
for (let i = 0; i < N; i++) {
  let t0 = performance.now()
  const text = readFileSync(JSON_PATH, 'utf8')
  tRead.push(performance.now() - t0)

  t0 = performance.now()
  raw = JSON.parse(text)
  tParse.push(performance.now() - t0)

  t0 = performance.now()
  const jsonString = JSON.stringify(raw)
  tStringify.push(performance.now() - t0)

  t0 = performance.now()
  const ms = MiniSearch.loadJSON(jsonString, { fields: FIELDS, storeFields: STORE, searchOptions: SEARCH_OPTS })
  tLoad.push(performance.now() - t0)

  t0 = performance.now()
  const catSet = new Set()
  const docs = ms._storedFields
  if (docs && docs instanceof Map) {
    for (const entry of docs.values()) {
      if (Array.isArray(entry.categories)) for (const c of entry.categories) if (c) catSet.add(c)
    }
  }
  const cats = Array.from(catSet).sort()
  tCats.push(performance.now() - t0)
  if (i === 0) console.log('docCount=', ms.documentCount, 'categories=', cats.length)
}
console.log('read     med', med(tRead).toFixed(1), 'ms')
console.log('parse    med', med(tParse).toFixed(1), 'ms')
console.log('stringify med', med(tStringify).toFixed(1), 'ms')
console.log('loadJSON med', med(tLoad).toFixed(1), 'ms')
console.log('cats     med', med(tCats).toFixed(1), 'ms')
console.log('TOTAL inflate med', (med(tRead) + med(tParse) + med(tStringify) + med(tLoad) + med(tCats)).toFixed(1), 'ms')
