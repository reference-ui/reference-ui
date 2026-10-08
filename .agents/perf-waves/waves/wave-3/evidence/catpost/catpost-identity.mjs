import { readFileSync } from 'node:fs'

const mod = await import(
  '/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c878-de3e-7760-a325-72552d079c1f-01a0c87c-934a-7590-a7b8-c75ef40b84c6/packages/reference-mcp/src/pipeline/icons-search-index.ts'
)
const { searchEngine } = mod
const baseline = JSON.parse(readFileSync('/tmp/catpost-baseline.json', 'utf8'))

const cases = {}
for (const c of [...searchEngine.categories, 'nonexistent-cat']) {
  cases[`cat:${c}:l25`] = searchEngine.search({ category: c, limit: 25 })
  cases[`cat:${c}:l100v`] = searchEngine.search({ category: c, limit: 100, verbose: true })
}
cases['edge:blank-demands'] = searchEngine.search({ demands: ['  '] })
cases['edge:blank-demands-v'] = searchEngine.search({ demands: ['  '], verbose: true, limit: 100 })
cases['edge:upper-cat'] = searchEngine.search({ category: 'NAVIGATION', limit: 25 })
cases['sanity:query-trash'] = searchEngine.search({ query: 'trash' })

let pass = 0, fail = 0
for (const k of Object.keys(baseline)) {
  const a = JSON.stringify(baseline[k])
  const b = JSON.stringify(cases[k])
  if (a === b) pass++
  else {
    fail++
    console.log('MISMATCH:', k, 'baseline len', a.length, 'diet len', b.length)
  }
}
console.log(`identity: ${pass}/${pass + fail} cases byte-identical`)
if (fail > 0) process.exit(1)
