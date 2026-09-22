import { describe, expect, it } from 'vitest'
import MiniSearch from 'minisearch'
import { searchEngine } from './icons-search-index'

function oldCategoryBrowse(category: string, limit: number, verbose: boolean) {
  const catLower = category.toLowerCase()
  const allResults = searchEngine.miniSearch.search(MiniSearch.wildcard, {
    filter: result => {
      const cats = (result.categories as string[]) || []
      return cats.some(c => c.toLowerCase() === catLower)
    },
  })
  const sliced = allResults.slice(0, limit).map(r => {
    const name = r.name as string
    const description = (r.description as string) || ''
    const categories = (r.categories as string[]) || ['general']
    const readout: Record<string, unknown> = { name, description }
    if (verbose) {
      readout.import = `import { ${name} } from '@reference-ui/icons'`
      readout.example = `<${name} size="md" color="text" />`
      readout.category = categories[0] || 'general'
    }
    return readout
  })
  return { total: allResults.length, returned: sliced.length, icons: sliced }
}

function med(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

describe('catpostings probe', () => {
  it('parity: totals + full order match wildcard path for every category', () => {
    for (const cat of searchEngine.categories) {
      const oldNames = oldCategoryBrowse(cat, 100, false).icons.map(i => i.name)
      const nu = searchEngine.search({ category: cat, limit: 100 })
      expect(nu.total).toBe(oldCategoryBrowse(cat, 100, false).total)
      expect(nu.icons.map(i => i.name)).toEqual(oldNames)
      // full-bucket order vs full wildcard order (beyond limit cap)
      const oldAll = searchEngine.miniSearch
        .search(MiniSearch.wildcard, {
          filter: r => ((r.categories as string[]) || []).some(c => c.toLowerCase() === cat),
        })
        .map(r => r.name as string)
      const bucketNames = (searchEngine.categoryIndex.get(cat) ?? []).map(e => e.name)
      expect(bucketNames).toEqual(oldAll)
      // verbose parity
      const oldV = oldCategoryBrowse(cat, 25, true)
      const nuV = searchEngine.search({ category: cat, limit: 25, verbose: true })
      expect(nuV).toEqual({ total: oldV.total, returned: oldV.returned, icons: oldV.icons })
    }
  })

  it('parity: unknown category + blank-demands edge', () => {
    const nu = searchEngine.search({ category: 'zzz-nope' })
    expect(nu).toEqual({ total: 0, returned: 0, icons: [] })
    const blank = searchEngine.search({ demands: [' '] })
    expect(blank.total).toBe(searchEngine.documentCount)
    expect(blank.returned).toBe(25)
  })

  it('bench: wildcard vs postings per category browse', () => {
    const cats = ['action', 'navigation', 'toggle']
    const ITERS = 1500
    for (const cat of cats) {
      // warmup
      for (let i = 0; i < 100; i++) {
        oldCategoryBrowse(cat, 25, false)
        searchEngine.search({ category: cat, limit: 25 })
      }
      const oldTimes: number[] = []
      const newTimes: number[] = []
      for (let i = 0; i < ITERS; i++) {
        let t0 = performance.now()
        oldCategoryBrowse(cat, 25, false)
        oldTimes.push(performance.now() - t0)
        t0 = performance.now()
        searchEngine.search({ category: cat, limit: 25 })
        newTimes.push(performance.now() - t0)
      }
      const o = med(oldTimes) * 1000
      const n = med(newTimes) * 1000
      console.log(
        `cat=${cat} old(wildcard)=${o.toFixed(1)}us new(postings)=${n.toFixed(1)}us speedup=${(o / n).toFixed(1)}x delta=${(o - n).toFixed(1)}us`
      )
    }
  }, 120000)
})
