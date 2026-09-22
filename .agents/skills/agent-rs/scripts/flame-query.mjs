/**
 * Read-only query API over a filed flame bundle: top-N longest functions,
 * per-function inspect drill-down, and module-grain burndown reports.
 *
 * All three commands scope to one sync phase (default compile) and print to
 * stdout without touching the bundle. Costs reuse the summary semantics: self
 * counts the leaf, inclusive counts each sample once per function on its stack.
 * Modules group Rust frames by crate plus top-level module and non-native
 * frames by library, so subsystem weight shows without function noise.
 */

import { loadBundle } from './flame-callers.mjs'
import { funcChildren } from './flame-edges.mjs'

const SHORT_LIBS = new Map([
  ['libsystem_kernel.dylib', 'kernel'],
  ['libsystem_malloc.dylib', 'malloc'],
  ['libsystem_platform.dylib', 'platform'],
  ['libsystem_c.dylib', 'libc'],
  ['libc++.1.dylib', 'libcxx'],
  ['libsystem_pthread.dylib', 'pthread'],
  ['libdyld.dylib', 'dyld'],
  ['dyld', 'dyld'],
  ['node', 'node'],
  ['esbuild', 'esbuild'],
  ['(unmapped jit)', 'js'],
])

export function shortLib(lib) {
  if (SHORT_LIBS.has(lib)) return SHORT_LIBS.get(lib)
  if (lib.endsWith('.map')) return 'js'
  if (lib.endsWith('.node')) return '.node'
  return lib
}

// Crate plus top-level module: atomic::resolve::tokens::f -> atomic::resolve.
// Generic/impl frames (<A as B>::f) and closures resolve through the inner path.
export function rustModule(name) {
  let text = name.startsWith('<') ? name.slice(1) : name
  const cut = text.search(/ as |[<>( ,]/)
  if (cut >= 0) text = text.slice(0, cut)
  const parts = text.split('::').filter((part) => part.length > 0)
  if (parts.length >= 2) return `${parts[0]}::${parts[1]}`
  return parts[0] ?? '(root)'
}

export function frameModule(lib, name) {
  if (!lib.endsWith('.node')) return `[${shortLib(lib)}]`
  return rustModule(name)
}

export function scopeSamples(bundle, phase) {
  if (phase === 'all') return bundle.samples
  const scoped = bundle.samples.filter((sample) => sample.p === phase)
  if (scoped.length === 0) {
    const valid = [...new Set(bundle.samples.map((sample) => sample.p))].sort()
    throw new Error(`no samples in phase '${phase}' (valid: all, ${valid.join(', ')})`)
  }
  return scoped
}

function scopedCosts(bundle, samples) {
  const costs = new Map()
  const touch = (fi) => {
    const key = `${bundle.frameLib[fi]}\n${bundle.frameName[fi]}`
    let hit = costs.get(key)
    if (!hit) {
      hit = { lib: bundle.frameLib[fi], name: bundle.frameName[fi], self: 0, incl: 0 }
      costs.set(key, hit)
    }
    return hit
  }
  for (const sample of samples) {
    touch(sample.f[sample.f.length - 1]).self += sample.w
    const seen = new Set()
    for (const fi of sample.f) {
      const key = `${bundle.frameLib[fi]}\n${bundle.frameName[fi]}`
      if (seen.has(key)) continue
      seen.add(key)
      touch(fi).incl += sample.w
    }
  }
  return [...costs.values()]
}

function scopeWeight(samples) {
  return samples.reduce((acc, sample) => acc + sample.w, 0)
}

function scopeHeader(bundle, phase, samples) {
  return `scope: ${phase} (${samples.length} samples, ${scopeWeight(samples)}wt of ${bundle.meta.scale})`
}

export function topFunctions(bundle, phase, limit) {
  const samples = scopeSamples(bundle, phase)
  const costs = scopedCosts(bundle, samples)
  const children = funcChildren(bundle, samples)
  const kept = []
  let folded = 0
  const scopeTotal = scopeWeight(samples)
  const ranked = costs.sort((a, b) => b.incl - a.incl || b.self - a.self)
  for (const row of ranked) {
    if (isPassThrough(row, children, scopeTotal)) {
      folded += 1
      continue
    }
    kept.push(row)
    if (kept.length >= limit) break
  }
  return { samples, rows: kept, folded }
}

// A spine frame adds nothing over its single hot child (start → node::Start
// → …); a zero-self frame covering the whole scope is the same shape with
// recursion-inflated children (interpreter trampolines). Both fold.
function isPassThrough(row, children, scopeTotal) {
  if (row.self === 0 && row.incl >= 0.99 * scopeTotal) return true
  const entry = children.get(`${row.lib}\n${row.name}`)
  if (!entry || entry.size !== 1) return false
  const [childWeight] = [...entry.values()]
  return childWeight >= 0.99 * row.incl
}

function moduleBucket(modules, module) {
  let hit = modules.get(module)
  if (!hit) {
    hit = { module, self: 0, incl: 0, funcs: new Set() }
    modules.set(module, hit)
  }
  return hit
}

function accumulateSampleModules(modules, bundle, sample) {
  const leaf = sample.f[sample.f.length - 1]
  moduleBucket(modules, frameModule(bundle.frameLib[leaf], bundle.frameName[leaf])).self += sample.w
  const seen = new Set()
  for (const fi of sample.f) {
    const module = frameModule(bundle.frameLib[fi], bundle.frameName[fi])
    const bucket = moduleBucket(modules, module)
    bucket.funcs.add(bundle.frameName[fi])
    if (seen.has(module)) continue
    seen.add(module)
    bucket.incl += sample.w
  }
}

function accumulateModules(bundle, samples) {
  const modules = new Map()
  for (const sample of samples) accumulateSampleModules(modules, bundle, sample)
  return modules
}

export function moduleReport(bundle, phase, limit) {
  const samples = scopeSamples(bundle, phase)
  const modules = accumulateModules(bundle, samples)
  const scopeTotal = scopeWeight(samples)
  const rows = []
  const folded = []
  const ranked = [...modules.values()]
    .map((row) => ({ ...row, funcs: row.funcs.size }))
    .sort((a, b) => b.incl - a.incl || b.self - a.self)
  for (const row of ranked) {
    if (row.incl >= 0.99 * scopeTotal && row.self <= 0.05 * scopeTotal) {
      folded.push(row)
      continue
    }
    rows.push(row)
    if (rows.length >= limit) break
  }
  return { samples, rows, folded }
}

function matchFunction(costs, query) {
  const exact = costs.filter((row) => row.name === query)
  if (exact.length > 0) return { match: exact[0], candidates: [] }
  const lowered = query.toLowerCase()
  const hits = costs.filter((row) => row.name.toLowerCase().includes(lowered))
  if (hits.length === 1) return { match: hits[0], candidates: [] }
  return { match: null, candidates: hits.sort((a, b) => b.incl - a.incl).slice(0, 20) }
}

function edgeNeighbors(bundle, samples, target, wantCaller) {
  const by = new Map()
  for (const sample of samples) {
    const idx = sample.f.findIndex((fi) => bundle.frameName[fi] === target)
    if (idx < 0) continue
    const neighbor = wantCaller ? idx - 1 : idx + 1
    if (neighbor < 0 || neighbor >= sample.f.length) continue
    const name = bundle.frameName[sample.f[neighbor]]
    by.set(name, (by.get(name) ?? 0) + sample.w)
  }
  return [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
}

function compressStack(bundle, sample, target) {
  const names = sample.f.map((fi) => bundle.frameName[fi])
  const idx = names.findIndex((name) => name === target)
  const above = names.slice(Math.max(0, idx - 3), idx).map((name) => trimName(name, 48))
  const below = names.slice(idx + 1, idx + 4).map((name) => trimName(name, 48))
  const head = idx - 3 > 0 ? ['…'] : []
  const tail = idx + 4 < names.length ? ['…'] : []
  return [...head, ...above, `*${trimName(target, 60)}*`, ...below, ...tail].join(' → ')
}

function exampleStacks(bundle, samples, target) {
  const seen = new Set()
  const out = []
  for (const sample of samples) {
    if (!sample.f.some((fi) => bundle.frameName[fi] === target)) continue
    const leaf = bundle.frameName[sample.f[sample.f.length - 1]]
    if (seen.has(leaf)) continue
    seen.add(leaf)
    out.push(compressStack(bundle, sample, target))
    if (out.length >= 3) break
  }
  return out
}

export function inspectFunction(bundle, phase, query) {
  const samples = scopeSamples(bundle, phase)
  const costs = scopedCosts(bundle, samples)
  const { match, candidates } = matchFunction(costs, query)
  if (!match) return { samples, match: null, candidates }
  return {
    samples,
    match,
    callers: edgeNeighbors(bundle, samples, match.name, true),
    callees: edgeNeighbors(bundle, samples, match.name, false),
    stacks: exampleStacks(bundle, samples, match.name),
  }
}

function pct(weight, total) {
  return ((weight / Math.max(1, total)) * 100).toFixed(1)
}

function trimName(name, limit) {
  return name.length > limit ? `${name.slice(0, limit - 1)}…` : name
}

function printTop(bundle, phase, limit) {
  const { samples, rows, folded } = topFunctions(bundle, phase, limit)
  const total = scopeWeight(samples)
  console.log(`[agent-rs] longest functions — ${scopeHeader(bundle, phase, samples)}`)
  console.log(`  ranked by inclusive; ${folded} pass-through spine frames folded (one child carries ≥99%)`)
  console.log('  rank   self   incl  self%  incl%  lib       frame')
  rows.forEach((row, i) => {
    console.log(
      `  ${(String(i + 1)).padStart(4)} ${String(row.self).padStart(6)} ${String(row.incl).padStart(6)}` +
      ` ${pct(row.self, total).padStart(6)} ${pct(row.incl, total).padStart(6)}  ${shortLib(row.lib).padEnd(9)} ${trimName(row.name, 90)}`,
    )
  })
}

function printModules(bundle, phase, limit) {
  const { samples, rows, folded } = moduleReport(bundle, phase, limit)
  const total = scopeWeight(samples)
  console.log(`[agent-rs] longest modules — ${scopeHeader(bundle, phase, samples)}`)
  console.log('  Rust frames group by crate::module; others by [lib]. incl counts each sample once per module.')
  if (folded.length > 0) {
    const names = folded.map((row) => `${row.module} (${row.self} self)`).join(', ')
    console.log(`  full-scope funnels folded: ${names}`)
  }
  console.log('  rank   self   incl  self%  incl%  funcs  module')
  rows.forEach((row, i) => {
    console.log(
      `  ${(String(i + 1)).padStart(4)} ${String(row.self).padStart(6)} ${String(row.incl).padStart(6)}` +
      ` ${pct(row.self, total).padStart(6)} ${pct(row.incl, total).padStart(6)} ${String(row.funcs).padStart(6)}  ${row.module}`,
    )
  })
}

function printInspect(bundle, phase, query) {
  const result = inspectFunction(bundle, phase, query)
  const total = scopeWeight(result.samples)
  if (!result.match) {
    if (result.candidates.length === 0) throw new Error(`no function matches '${query}' in phase '${phase}'`)
    const names = result.candidates.map((row) => `    ${row.incl}wt ${row.name}`).join('\n')
    throw new Error(`'${query}' is ambiguous in phase '${phase}' — candidates:\n${names}`)
  }
  const row = result.match
  console.log(`[agent-rs] inspect — ${scopeHeader(bundle, phase, result.samples)}`)
  console.log(`  ${row.name}`)
  console.log(`  lib ${row.lib} · self ${row.self} (${pct(row.self, total)}%) · incl ${row.incl} (${pct(row.incl, total)}%)`)
  console.log('  callers:')
  for (const [name, w] of result.callers) console.log(`    ${String(w).padStart(5)}wt ${trimName(name, 95)}`)
  console.log('  callees:')
  for (const [name, w] of result.callees) console.log(`    ${String(w).padStart(5)}wt ${trimName(name, 95)}`)
  console.log('  example stacks (* = inspected):')
  for (const stack of result.stacks) console.log(`    ${trimName(stack, 260)}`)
}

export function runQueryCommand(request) {
  const bundle = loadBundle(request.srcDir)
  if (request.mode === 'top') printTop(bundle, request.phase, request.limit)
  else if (request.mode === 'modules') printModules(bundle, request.phase, request.limit)
  else printInspect(bundle, request.phase, request.target)
  return 0
}
