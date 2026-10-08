import { IconsSearchEngine } from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-977b-7ee3-8430-2042be652567/packages/reference-mcp/src/pipeline/icons-search-index.ts'
import rawIndex from '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-977b-7ee3-8430-2042be652567/packages/reference-mcp/src/data/icons-index.json' with { type: 'json' }

const engine = new IconsSearchEngine(rawIndex)
const out = []
// single queries incl repeats (hit path), verbose, limits, categories
for (const q of ['trash', 'trash', 'magnifying glass', 'seach', 'setings', 'pencil', 'cross', 'trash']) {
  out.push(engine.search({ query: q }))
}
out.push(engine.search({ query: 'trash', verbose: true }))
out.push(engine.search({ query: 'trash', verbose: true }))
out.push(engine.search({ query: 'arrow', limit: 5 }))
out.push(engine.search({ query: 'arrow', limit: 5 }))
out.push(engine.search({ query: 'arrow', limit: 7 }))
out.push(engine.search({ category: 'navigation', limit: 10, verbose: true }))
out.push(engine.search({ demands: ['shopping cart', 'trash', 'gear'] }))
out.push(engine.search({ demands: ['shopping cart', 'trash', 'shopping cart', 'trash', 'gear', 'gear'] }))
out.push(engine.search({ query: 'I need an icon for user settings, a shopping cart, and a trash can for deletion' }))
out.push(engine.search({ query: 'I need an icon for user settings, a shopping cart, and a trash can for deletion' }))
out.push(engine.searchDemand('trash', 5, undefined, false))
out.push(engine.searchDemand('trash', 5, undefined, true))
out.push(engine.searchDemand('trash', 5, 'action', false))
out.push(engine.searchDemand('trash', 2, 'action', false))
out.push(engine.searchDemand('  trash  ', 5, undefined, false))
out.push(engine.searchDemand('', 5, undefined, false))
out.push(engine.search())
// mutation-safety: mutate a returned array, re-query, must be unaffected
const m1 = engine.searchDemand('gear', 5, undefined, false)
m1.icons.length = 0
m1.icons.push({ name: 'POISON', description: 'x' })
out.push(engine.searchDemand('gear', 5, undefined, false))
console.log(JSON.stringify(out))
