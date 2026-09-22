// Equivalence battery: runs fixed query set, prints sha256 of all results + timings.
import { createHash } from 'node:crypto'
const bundle = process.argv[2]
const t0 = performance.now()
const mod = await import(bundle)
const importMs = performance.now() - t0
const searchIcons = mod.searchIcons
const queries = [
  undefined,
  { query: 'trash' },
  { query: 'trash', verbose: true },
  { query: 'magnifying glass' },
  { query: 'pencil' },
  { query: 'cross' },
  { query: 'seach' },
  { query: 'setings' },
  { query: 'I need an icon for user settings, a shopping cart, and a trash can for deletion' },
  { demands: ['shopping cart', 'trash', 'gear'] },
  { category: 'navigation', limit: 10, verbose: true },
  { query: 'arrow', limit: 5 },
]
const t1 = performance.now()
const first = searchIcons(queries[1])
const firstSearchMs = performance.now() - t1
const out = queries.map(q => searchIcons(q))
const hash = createHash('sha256').update(JSON.stringify(out)).digest('hex')
const cats = mod.ICON_CATEGORIES ?? (mod.getIconCategories ? mod.getIconCategories() : null)
const catHash = createHash('sha256').update(JSON.stringify(cats)).digest('hex')
console.log(JSON.stringify({ importMs: +importMs.toFixed(2), firstSearchMs: +firstSearchMs.toFixed(2), resultsHash: hash, catHash, catLen: cats?.length }))
