/**
 * Memex engine: manifests in, ranked docs out. No CLI side effects.
 *
 * Manifest collections (doom, cases, surfaces, perf, flames) load from
 * `.agents/memex/collections/*.json`; the graph system collection is
 * built in. Everything is read live on every call, so there is no
 * stale state and no rebuild step. MiniSearch ranks globally over
 * manifest collections, except targeted perf search, which keeps its
 * exact substring-AND semantics. The graph is targeted-only: thousands
 * of harvested headers would drown curated hits in a global rank, so
 * it answers --in graph and show <path>.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import {
  collectMarkdown,
  collectNeo,
  collectPerf,
  collectRs,
  formatPerfShow,
  perfCounts,
  substringSearch,
} from './adapters.mjs'
import { GRAPH_NAME, chainShow, collectGraph } from './graph.mjs'
import { processTerm, snippet, snippetNeedles, tokenize } from './text.mjs'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const COLLECTIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  'collections'
)
export const DEFAULT_LIMIT = 15
export const LIST_CAP = 300
export const GRAPH_BOOSTS = { title: 2 }

const requireFromHere = createRequire(import.meta.url)

/** MiniSearch resolves from the root install; say so when it cannot. */
export function loadMiniSearch() {
  try {
    const mod = requireFromHere('minisearch')
    return mod.default ?? mod
  } catch {
    throw new Error(
      'memex needs the minisearch package from the workspace root install — run `pnpm install` at the repo root.'
    )
  }
}

export class UsageError extends Error {
  constructor(message, json = false) {
    super(message)
    this.json = json
  }
}

export function loadManifests() {
  const manifests = []
  for (const entry of readdirSync(COLLECTIONS_DIR).sort()) {
    if (!entry.endsWith('.json')) continue
    const manifest = JSON.parse(readFileSync(join(COLLECTIONS_DIR, entry), 'utf8'))
    manifest.system = false
    manifests.push(manifest)
  }
  manifests.push({
    name: GRAPH_NAME,
    description:
      'System collection: every README.md plus every file-top header comment, harvested from convention.',
    owner: 'memex built-in',
    kind: GRAPH_NAME,
    system: true,
    weights: GRAPH_BOOSTS,
  })
  return manifests.sort((a, b) => a.name.localeCompare(b.name))
}

/** Collect every doc of one manifest; perf entries ride along for global rank. */
export function collectCollection(manifest, root = ROOT) {
  switch (manifest.kind) {
    case 'markdown': {
      const docs = []
      const warnings = []
      for (const r of manifest.roots) {
        const found = collectMarkdown(join(root, r), manifest)
        for (const doc of found.docs) {
          doc.path = join(r, doc.path)
          docs.push(doc)
        }
        for (const w of found.warnings) warnings.push(w)
      }
      return { docs, warnings }
    }
    case 'neo':
      return collectNeo(join(root, manifest.root), root, manifest.name)
    case 'rs':
      return collectRs(join(root, manifest.root), root, manifest.name)
    case 'perf':
      return collectPerf(join(root, manifest.index), manifest.name)
    case GRAPH_NAME:
      return collectGraph(root)
    default:
      throw new UsageError(
        `collection '${manifest.name}' has unknown kind '${manifest.kind}'`
      )
  }
}

function mergeBoosts(manifests) {
  const boosts = {}
  for (const m of manifests) {
    for (const [field, weight] of Object.entries(m.weights || {})) {
      boosts[field] = Math.max(boosts[field] || 0, weight)
    }
  }
  return boosts
}

function unionFields(docs) {
  const fields = new Set()
  for (const doc of docs) {
    for (const field of Object.keys(doc.fields)) fields.add(field)
  }
  return [...fields]
}

/** One MiniSearch over docs; missing fields normalize to empty. */
export function buildIndex(docs, boosts) {
  const MiniSearch = loadMiniSearch()
  const fields = unionFields(docs)
  const mini = new MiniSearch({
    fields,
    storeFields: ['collection', 'title'],
    idField: 'key',
    tokenize,
    processTerm,
    searchOptions: { prefix: true, fuzzy: 0.2, boost: boosts },
  })
  mini.addAll(
    docs.map(doc => {
      const row = {
        key: `${doc.collection}:${doc.id}`,
        collection: doc.collection,
        title: doc.title,
      }
      for (const field of fields) row[field] = doc.fields[field] ?? ''
      return row
    })
  )
  return mini
}

const COLLECTION_PRIOR = { surfaces: 3, cases: 2 }
function prior(collection) {
  return COLLECTION_PRIOR[collection] ?? 1
}

function matchedFields(doc, needles) {
  if (!needles.length) return []
  return Object.keys(doc.fields).filter(field =>
    needles.some(needle =>
      String(doc.fields[field] ?? '')
        .toLowerCase()
        .includes(needle)
    )
  )
}

function toHit(doc, score, terms, exclude) {
  const snip = snippet(doc.snippetText, terms, exclude)
  exclude.add(snip.text)
  const needles = snippetNeedles(terms)
  const shown = needles.some(needle => snip.text.toLowerCase().includes(needle))
  const matched = snip.fuzzy.length || shown ? [] : matchedFields(doc, needles)
  return {
    collection: doc.collection,
    id: doc.id,
    score: score === null ? null : Math.round(score * 1000) / 1000,
    title: doc.title,
    extra: doc.extra,
    path: doc.path,
    snippet: snip.text,
    fuzzy: snip.fuzzy,
    matched,
  }
}

function rankMini(docs, boosts, query, terms, limit, weigh) {
  const mini = buildIndex(docs, boosts)
  const byId = new Map(docs.map(d => [`${d.collection}:${d.id}`, d]))
  const ranked = mini.search(query).map(hit => ({
    hit,
    score: weigh ? hit.score * prior(hit.collection) : hit.score,
  }))
  if (weigh) ranked.sort((a, b) => b.score - a.score)
  const exclude = new Set()
  return {
    hits: ranked
      .slice(0, limit)
      .map(({ hit, score }) => toHit(byId.get(hit.id), score, terms, exclude)),
    total: ranked.length,
  }
}

/**
 * Ranked search. No query + no collection lists collections; no query +
 * a collection lists its roster. Targeted perf search keeps exact
 * substring-AND semantics; everything else ranks through MiniSearch.
 * Global rank weights authoritative collections over evidence logs.
 */
export function search(all, query, { collection = null, limit = DEFAULT_LIMIT } = {}) {
  const terms = query.trim().split(/\s+/).filter(Boolean)
  if (collection != null) {
    const docs = all.docs.filter(d => d.collection === collection)
    if (collection === 'perf') {
      const entries = docs.map(d => d.payload.entry)
      const matches = substringSearch(entries, query)
      const exclude = new Set()
      return {
        hits: matches.slice(0, limit).map(e =>
          toHit(
            docs.find(d => d.id === e.id),
            null,
            terms,
            exclude
          )
        ),
        total: matches.length,
      }
    }
    const boosts = {}
    for (const [field, weight] of Object.entries(
      all.manifest(collection).weights || {}
    )) {
      boosts[field] = weight
    }
    return rankMini(docs, boosts, query, terms, limit, false)
  }
  const curated = all.docs.filter(d => d.collection !== GRAPH_NAME)
  return rankMini(curated, mergeBoosts(all.manifests), query, terms, limit, true)
}

export function loadAll(manifests, root = ROOT) {
  const docs = []
  const warnings = []
  const counts = {}
  for (const manifest of manifests) {
    const found = collectCollection(manifest, root)
    for (const doc of found.docs) docs.push(doc)
    for (const w of found.warnings) warnings.push(`[${manifest.name}] ${w}`)
    counts[manifest.name] = found.docs.length
  }
  return {
    docs,
    warnings,
    counts,
    manifests,
    manifest: name =>
      manifests.find(m => m.name.toLowerCase() === String(name).toLowerCase()),
  }
}

export function roster(all, collection, limit = LIST_CAP) {
  const docs = all.docs.filter(d => d.collection === collection)
  if (collection === 'perf') {
    const { waves, verdicts } = perfCounts(docs.map(d => d.payload.entry))
    const built = docs[0]?.payload.built ?? '?'
    return {
      docs: docs.slice(0, limit),
      total: docs.length,
      header: { built, waves, verdicts },
    }
  }
  return { docs: docs.slice(0, limit), total: docs.length, header: null }
}

export const CANDIDATE_CAP = 10

function base(id) {
  const cut = id.lastIndexOf('/')
  return cut === -1 ? id : id.slice(cut + 1)
}

function pick(matches) {
  if (matches.length === 1) return { doc: matches[0] }
  if (matches.length > 1) return { candidates: matches }
  return null
}

function findById(all, ref) {
  const [collection, ...rest] = ref.includes(':') ? ref.split(':') : [null, ref]
  const id = rest.join(':')
  if (collection && collection.toLowerCase() === 'rs') {
    return findById(all, `surfaces:${ref}`)
  }
  const pool = collection
    ? all.docs.filter(d => d.collection.toLowerCase() === collection.toLowerCase())
    : all.docs
  return (
    pick(pool.filter(d => d.id === id)) ??
    pick(pool.filter(d => d.id.toLowerCase() === id.toLowerCase())) ??
    pick(pool.filter(d => base(d.id) === id)) ??
    pick(pool.filter(d => base(d.id).toLowerCase() === id.toLowerCase())) ??
    pick(pool.filter(d => d.id === `${id}.md`)) ??
    (collection ? null : pick(all.docs.filter(d => d.id === `rs:${id}`))) ?? { doc: null }
  )
}

function resolvePath(root, ref) {
  const abs = isAbsolute(ref) ? ref : resolve(join(root, ref))
  if (abs !== root && !abs.startsWith(`${root}/`)) return { kind: 'outside', abs }
  try {
    if (statSync(abs).isFile()) return { kind: 'file', abs }
    if (statSync(abs).isDirectory()) return { kind: 'dir', abs }
    return { kind: 'missing', abs }
  } catch {
    return { kind: 'missing', abs }
  }
}

function formatDocShow(doc) {
  const head = `${doc.collection}:${doc.id} — ${doc.title}`
  switch (doc.kind) {
    case 'perf':
      return formatPerfShow(doc.payload.entry)
    case 'neo': {
      const p = doc.payload
      const lines = [head, `path: ${doc.path}`, `family: ${p.family}`]
      if (p.related.length) lines.push(`related: ${p.related.join(' ')}`)
      if (p.specs.length) lines.push(`specs:\n  ${p.specs.join('\n  ')}`)
      lines.push(`\n${p.readme || '(no README)'}`)
      return lines.join('\n')
    }
    case 'rs': {
      const p = doc.payload
      const lines = [head, `path: ${doc.path}`]
      if (p.related.length) {
        const refs = p.related.map(r => (r.startsWith('rs:') ? `surfaces:${r}` : r))
        lines.push(`related: ${refs.join(' ')}`)
      }
      lines.push(`suites (${p.suites.length}):\n  ${p.suites.join('\n  ')}`)
      const shown = p.caseIds.slice(0, 50)
      lines.push(
        `cases (${p.caseIds.length}): ${shown.join(' ')}${
          p.caseIds.length > shown.length ? ' …' : ''
        }`
      )
      lines.push(`\n${p.readme || '(no README)'}`)
      return lines.join('\n')
    }
    default:
      return `${head}\npath: ${doc.path}\n\n${doc.payload.raw}`
  }
}

/**
 * Show one thing. Files walk the graph (own header plus ancestor
 * READMEs, depth-capped); directories resolve to their README; ids and
 * `collection:id` refs fetch docs. An explicit --up on a graph label
 * walks that file; on any other id it is a usage error, never silent.
 */
export function show(
  all,
  ref,
  { up = Infinity, upExplicit = false, root = ROOT, candidateLimit = CANDIDATE_CAP } = {}
) {
  const resolved = resolvePath(root, ref)
  if (resolved.kind === 'outside') {
    return { missing: true, text: `path '${ref}' is outside the repo` }
  }
  if (resolved.kind === 'file') {
    return { text: chainShow(root, resolved.abs, up) }
  }
  if (resolved.kind === 'dir') {
    const readme = join(resolved.abs, 'README.md')
    try {
      if (statSync(readme).isFile()) return { text: chainShow(root, readme, up) }
    } catch {
      // fall through to id lookup, then the generic miss
    }
  }
  const found = findById(all, ref)
  if (found.doc) {
    if (upExplicit && found.doc.kind !== GRAPH_NAME) {
      return {
        misuse: true,
        text: `--up applies to paths only — '${ref}' is a ${found.doc.collection} doc`,
      }
    }
    if (upExplicit && found.doc.kind === GRAPH_NAME) {
      return { text: chainShow(root, join(root, found.doc.path), up) }
    }
    return { text: formatDocShow(found.doc), doc: found.doc }
  }
  if (found.candidates) {
    const shown = found.candidates.slice(0, candidateLimit)
    const lines = shown.map(d => `  ${d.collection}:${d.id} — ${d.title}`)
    const more =
      found.candidates.length > shown.length
        ? `\n  …and ${found.candidates.length - shown.length} more (--limit ${found.candidates.length} for all)`
        : ''
    return {
      ambiguous: true,
      candidates: found.candidates.map(d => ({
        collection: d.collection,
        id: d.id,
        title: d.title,
      })),
      text: `${found.candidates.length} matches for '${ref}' — qualify with a collection:\n${lines.join('\n')}${more}`,
    }
  }
  return { missing: true, text: `unknown id or path '${ref}'` }
}

export function collectionTable(all) {
  return all.manifests.map(m => ({
    name: m.name,
    kind: m.system ? 'system' : m.kind,
    docs: all.counts[m.name] ?? 0,
    description: m.description,
  }))
}
