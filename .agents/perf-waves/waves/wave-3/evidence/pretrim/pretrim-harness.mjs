import { readFileSync, writeFileSync } from 'node:fs'

// Battery of realistic demands/queries
export const DEMANDS = [
  'trash', 'search', 'user settings', 'shopping cart', 'magnifying glass',
  'pencil', 'cross', 'seach', 'setings', 'arrow', 'home', 'bell',
  'user settings and cart', 'logout', 'gear', 'heart', 'eye', 'house',
  'delete forever', 'check circle', 'person profile avatar', 'visibility off',
  'notifications alert', 'favorite bookmark', 'close dialog', 'edit document',
  'download file', 'upload cloud', 'menu navigation', 'chevron right',
  'I need an icon for user settings, a shopping cart, and a trash can for deletion',
  'calendar date picker', 'star rating', 'lock secure', 'wifi signal',
]

export async function loadEngine(enginePath, indexPath) {
  const mod = await import(enginePath + `?t=${Date.now()}`)
  const raw = readFileSync(indexPath, 'utf8')
  return new mod.IconsSearchEngine(JSON.parse(raw))
}

export function benchSearch(engine, iters = 200) {
  // warmup
  for (const d of DEMANDS) engine.searchDemand(d, 5)
  const t0 = performance.now()
  for (let i = 0; i < iters; i++) {
    for (const d of DEMANDS) engine.searchDemand(d, 5)
  }
  const t1 = performance.now()
  const totalCalls = iters * DEMANDS.length
  return { totalMs: t1 - t0, calls: totalCalls, usPerCall: ((t1 - t0) * 1000) / totalCalls }
}

export function snapshot(engine, limit = 25) {
  const out = {}
  for (const d of DEMANDS) {
    const r = engine.searchDemand(d, limit)
    out[d] = { total: r.total, icons: r.icons }
  }
  // category browse path
  out['__cat:navigation'] = engine.search({ category: 'navigation', limit: 10 })
  out['__cat:action'] = engine.search({ category: 'action', limit: 10 })
  return out
}

export function rankKey(snap) {
  const o = {}
  for (const [k, v] of Object.entries(snap)) {
    if (k.startsWith('__cat')) o[k] = v.icons.map(i => i.name)
    else o[k] = { total: v.total, names: v.icons.map(i => i.name) }
  }
  return o
}
