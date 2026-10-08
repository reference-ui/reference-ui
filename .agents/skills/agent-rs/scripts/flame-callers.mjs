/**
 * Caller and edge attribution over a filed flame bundle (agentrs-flame-callers/1).
 *
 * The filed summary.md flattens stacks into leaf tables; this view recovers the
 * parents: caller distributions for hot leaves, malloc/memmove/memcmp attribution
 * by nearest Rust ancestor, deduped native call edges, and an allocator-below
 * check for hot native functions. It reads a bundle's preserved raws and files
 * callers.md plus burndown.md next to them without re-recording. Every table
 * states the weight it covers so a reader can see what is and isn't attributed.
 */

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { nativeEdgeTable } from './flame-edges.mjs'
import { buildScan, indexSidecar, loadProfile } from './flame-summary.mjs'
import { bucketize, checkFlameAlignment, phaseWindows, sampleWeightOf } from './phases.mjs'

export const CALLERS_PROCEDURE = 'agentrs-flame-callers/1'

function requireFile(dir, file) {
  const filePath = path.join(dir, file)
  try {
    statSync(filePath)
  } catch {
    throw new Error(`callers source is missing ${file}: ${dir}`)
  }
  return filePath
}

// Root-to-leaf frame chains with weights and phases; bundles without a
// phases file scope everything to 'all' instead of failing.
export function loadBundle(srcDir) {
  const dir = path.resolve(srcDir)
  const profilePath = requireFile(dir, 'profile.json.gz')
  const sidecarPath = requireFile(dir, 'profile.json.syms.json')
  const meta = JSON.parse(readFileSync(requireFile(dir, 'meta.json'), 'utf-8'))
  const profile = loadProfile(profilePath)
  const sidecar = JSON.parse(readFileSync(sidecarPath, 'utf-8'))
  const { thread, frames } = buildScan(profile, indexSidecar(sidecar))
  const frameName = frames.map((row) => row.name)
  const frameLib = frames.map((row) => row.libName)
  let times = null
  let windows = null
  try {
    const phases = JSON.parse(readFileSync(path.join(dir, 'phases.json'), 'utf-8'))
    const alignment = checkFlameAlignment(profile, phases)
    if (!alignment.ok) throw new Error(`flame phases unaligned: ${alignment.reason}`)
    times = alignment.times
    windows = phaseWindows(phases)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
  const samples = []
  for (let i = 0; i < thread.samples.length; i += 1) {
    const chain = []
    let stack = thread.samples.stack[i]
    while (stack !== null && stack !== undefined) {
      chain.push(thread.stackTable.frame[stack])
      stack = thread.stackTable.prefix[stack]
    }
    chain.reverse()
    samples.push({
      w: sampleWeightOf(thread, i),
      p: times ? bucketize(times[i], windows) : 'all',
      f: chain,
    })
  }
  return { dir, meta, frameName, frameLib, samples, hasPhases: times !== null }
}

function leafKey(bundle, sample) {
  const fi = sample.f[sample.f.length - 1]
  return `${bundle.frameLib[fi]} :: ${bundle.frameName[fi]}`
}

function sumWeights(samples) {
  return samples.reduce((acc, sample) => acc + sample.w, 0)
}

// Caller of a target = the frame directly below its outermost occurrence;
// recursion would otherwise attribute the function to itself.
export function callerDistribution(bundle, targetName) {
  const callers = new Map()
  let incl = 0
  for (const sample of bundle.samples) {
    const idx = sample.f.findIndex((fi) => bundle.frameName[fi] === targetName)
    if (idx < 0) continue
    incl += sample.w
    const caller = idx > 0 ? bundle.frameName[sample.f[idx - 1]] : '(root)'
    callers.set(caller, (callers.get(caller) ?? 0) + sample.w)
  }
  return { incl, callers }
}

function nearestAncestor(bundle, sample, accept) {
  for (let i = sample.f.length - 2; i >= 0; i -= 1) {
    if (accept(sample.f[i])) return sample.f[i]
  }
  return -1
}

function isAtomicCanon(bundle, fi) {
  if (!bundle.frameLib[fi].endsWith('.node')) return false
  const name = bundle.frameName[fi]
  return !/^(alloc::|core::|std::|hashbrown|smallvec|indexmap|__rustc|core::ptr::drop_in_place|<)/.test(name)
}

// Leaves matching leafTest, attributed to the nearest ancestor matching
// accept; falls back to any .node ancestor so infra frames still land.
export function attributeLeaves(bundle, leafTest, accept) {
  const by = new Map()
  let total = 0
  let unattributed = 0
  for (const sample of bundle.samples) {
    const leaf = sample.f[sample.f.length - 1]
    if (!leafTest(bundle.frameName[leaf])) continue
    total += sample.w
    let fi = nearestAncestor(bundle, sample, (cand) => accept(cand))
    if (fi < 0) fi = nearestAncestor(bundle, sample, (cand) => bundle.frameLib[cand].endsWith('.node'))
    if (fi < 0) {
      unattributed += sample.w
      continue
    }
    const name = bundle.frameName[fi]
    by.set(name, (by.get(name) ?? 0) + sample.w)
  }
  return { total, unattributed, by }
}

export function isMallocLeaf(name) {
  return /malloc|nanov2|realloc|szone_|small_|tiny_|_free|calloc/.test(name) && !/mvm_|mach_vm|kernelrpc/.test(name)
}

const SYSCALL_PATH_LIBS = new Set([
  'libsystem_kernel.dylib',
  'libsystem_c.dylib',
  'libsystem_malloc.dylib',
  'libsystem_platform.dylib',
  'libsystem_pthread.dylib',
  'libc++.1.dylib',
  'libdyld.dylib',
  'dyld',
])

// __open's direct parent is the libc `open` stub: walk past the syscall
// path to the frame that actually issued the open (uv__fs_work et al).
export function openCallers(bundle) {
  const by = new Map()
  let total = 0
  for (const sample of bundle.samples) {
    const leaf = sample.f[sample.f.length - 1]
    if (bundle.frameName[leaf] !== '__open') continue
    total += sample.w
    let caller = '(unknown)'
    for (let i = sample.f.length - 2; i >= 0; i -= 1) {
      if (SYSCALL_PATH_LIBS.has(bundle.frameLib[sample.f[i]])) continue
      caller = `${bundle.frameName[sample.f[i]]} [${bundle.frameLib[sample.f[i]]}]`
      break
    }
    by.set(caller, (by.get(caller) ?? 0) + sample.w)
  }
  return { total, by }
}

export function dedupedEdges(bundle, phase) {
  const scoped = phase === 'all' ? bundle.samples : bundle.samples.filter((s) => s.p === phase)
  return { scopedWeight: sumWeights(scoped), by: nativeEdgeTable(bundle, scoped) }
}

// Share of a hot function's stacks with allocator frames below it flags
// per-call allocation (e.g. a lowercasing copy) from the profile alone.
export function allocBelow(bundle, targetNames) {
  return targetNames
    .map((target) => scanAllocBelow(bundle, target))
    .filter((row) => row.stacks > 0)
    .sort((a, b) => b.withAlloc - a.withAlloc)
}

function scanAllocBelow(bundle, target) {
  let stacks = 0
  let withAlloc = 0
  for (const sample of bundle.samples) {
    if (!stackHasFrame(bundle, sample, target)) continue
    stacks += sample.w
    if (stackAllocBelow(bundle, sample, target)) withAlloc += sample.w
  }
  return { target, stacks, withAlloc }
}

function stackHasFrame(bundle, sample, target) {
  return sample.f.some((fi) => bundle.frameName[fi] === target)
}

function stackAllocBelow(bundle, sample, target) {
  const idx = sample.f.findIndex((fi) => bundle.frameName[fi] === target)
  return sample.f.slice(idx + 1).some((fi) => /malloc|realloc|alloc|_free/i.test(bundle.frameName[fi]))
}

function rankSelf(bundle) {
  const self = new Map()
  for (const sample of bundle.samples) {
    const key = leafKey(bundle, sample)
    self.set(key, (self.get(key) ?? 0) + sample.w)
  }
  return [...self.entries()].sort((a, b) => b[1] - a[1])
}

function callerTargets(bundle) {
  const ranked = rankSelf(bundle)
  const names = []
  const seen = new Set()
  const take = (key) => {
    const name = key.split(' :: ')[1]
    if (seen.has(name)) return
    seen.add(name)
    names.push(name)
  }
  for (const [key] of ranked.slice(0, 12)) take(key)
  for (const [key] of ranked.filter(([key]) => key.includes('.node')).slice(0, 10)) take(key)
  return names
}

export function analyzeCallers(bundle) {
  const isNode = (fi) => bundle.frameLib[fi].endsWith('.node')
  const malloc = attributeLeaves(bundle, isMallocLeaf, (fi) => isAtomicCanon(bundle, fi))
  const memmove = attributeLeaves(bundle, (n) => n.includes('memmove'), isNode)
  const memcmp = attributeLeaves(bundle, (n) => n.includes('memcmp'), isNode)
  const open = openCallers(bundle)
  const nativeSelf = rankSelf(bundle)
    .filter(([key]) => key.includes('.node'))
    .slice(0, 15)
    .map(([key]) => key.split(' :: ')[1])
  return {
    totalWeight: sumWeights(bundle.samples),
    sampleCount: bundle.samples.length,
    targets: callerTargets(bundle).map((name) => ({ name, ...callerDistribution(bundle, name) })),
    malloc,
    memmove,
    memcmp,
    open,
    edges: dedupedEdges(bundle, bundle.hasPhases ? 'compile' : 'all'),
    allocBelow: allocBelow(bundle, nativeSelf),
  }
}

function topRows(by, limit) {
  return [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
}

function weightTable(rows, total) {
  return rows.map(([name, w]) => `| ${w} | ${((w / total) * 100).toFixed(1)}% | \`${name}\` |`)
}

function pushSection(lines, title, note, rows) {
  lines.push('', `## ${title}`, '', note, '', '| weight | share | frame |', '| --- | --- | --- |')
  for (const row of rows) lines.push(row)
  if (rows.length === 0) lines.push('| — | — | (none) |')
}

export function renderCallersMarkdown(bundle, analysis, provenance) {
  const total = Math.max(1, analysis.totalWeight)
  const lines = [
    `# Caller attribution: ${bundle.meta.scale} (${bundle.meta.pin?.name ?? 'unpinned'})`,
    '',
    `Procedure: \`${provenance.procedure}\` over \`${provenance.srcProcedure}\` raws in \`${provenance.srcRel}\`.`,
    `Derived ${provenance.createdAt} via \`${provenance.command}\`; no re-record, bundle raws untouched.`,
    `Covers ${analysis.totalWeight} weight across ${bundle.samples.length} main-thread samples. Shares below are of that weight unless noted.`,
    '',
  ]
  for (const target of analysis.targets) {
    pushSection(
      lines,
      `Callers of \`${target.name}\``,
      `Inclusive ${target.incl}wt. Caller = frame directly below the outermost occurrence.`,
      weightTable(topRows(target.callers, 8), total),
    )
  }
  pushSection(
    lines,
    'Malloc-family leaves by nearest atomic/canon ancestor',
    `${analysis.malloc.total}wt of malloc-family leaves; ${analysis.malloc.unattributed}wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.`,
    weightTable(topRows(analysis.malloc.by, 18), total),
  )
  pushSection(
    lines,
    'memmove leaves by nearest .node ancestor',
    `${analysis.memmove.total}wt of memmove leaves; ${analysis.memmove.unattributed}wt with no .node ancestor.`,
    weightTable(topRows(analysis.memmove.by, 14), total),
  )
  pushSection(
    lines,
    'memcmp leaves by nearest .node ancestor',
    `${analysis.memcmp.total}wt of memcmp leaves; ${analysis.memcmp.unattributed}wt with no .node ancestor.`,
    weightTable(topRows(analysis.memcmp.by, 14), total),
  )
  pushSection(
    lines,
    'File opens by issuing frame',
    `${analysis.open.total}wt of __open leaves, attributed past the libc stub to the frame that issued the open.`,
    weightTable(topRows(analysis.open.by, 10), total),
  )
  pushSection(
    lines,
    'Callees: hottest deduped native edges',
    `${analysis.edges.scopedWeight}wt in scope (${bundle.hasPhases ? 'compile phase' : 'whole run'}); each edge counted once per sample.`,
    weightTable(topRows(analysis.edges.by, 25), total),
  )
  lines.push('', '## Allocator frames below hot native functions', '', 'Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.', '', '| stacks | with alloc | share | function |', '| --- | --- | --- | --- |')
  for (const row of analysis.allocBelow) {
    lines.push(`| ${row.stacks} | ${row.withAlloc} | ${((row.withAlloc / Math.max(1, row.stacks)) * 100).toFixed(0)}% | \`${row.target}\` |`)
  }
  lines.push('')
  return lines.join('\n')
}

export function runCallersCommand(request) {
  const src = path.resolve(request.srcDir)
  const out = request.outDir ? path.resolve(request.outDir) : src
  const bundle = loadBundle(src)
  const provenance = {
    procedure: CALLERS_PROCEDURE,
    srcProcedure: bundle.meta.procedure ?? 'unknown',
    srcRel: path.relative(request.repoRoot, src) || src,
    command: request.command.join(' '),
    createdAt: new Date().toISOString(),
  }
  mkdirSync(out, { recursive: true })
  const analysis = analyzeCallers(bundle)
  writeFileSync(path.join(out, 'callers.md'), renderCallersMarkdown(bundle, analysis, provenance))
  printCallersReport(out, analysis)
  return { outDir: out, analysis }
}

function printCallersReport(outDir, analysis) {
  console.log(`\n[agent-rs] flame callers: ${outDir}`)
  console.log(`  weight: ${analysis.totalWeight} across ${analysis.sampleCount} samples`)
  console.log('  top malloc-ancestor:')
  const top = [...analysis.malloc.by.entries()].sort((a, b) => b[1] - a[1])[0]
  if (top) console.log(`    ${top[1]}wt ${top[0].slice(0, 80)}`)
}
