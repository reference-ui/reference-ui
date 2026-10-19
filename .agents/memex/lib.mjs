/**
 * Memex engine: manifests in, ranked docs out. No CLI side effects.
 *
 * Manifest collections (cases, rs-cases, surfaces) load from
 * `.agents/memex/collections/*.json`; the graph system collection is
 * built in. Everything is read live on every call, so there is no
 * stale state and no rebuild step. MiniSearch ranks globally over
 * manifest collections. The graph is targeted-only: thousands
 * of harvested headers would drown curated hits in a global rank, so
 * it answers --in graph and show <path>.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import {
  collectMarkdown,
  collectCore,
  collectRs,
  collectRsCases,
  loadMarkdownDoc,
} from './adapters.mjs'
import { facetValues, facetsOf, matchesFacets } from './facets.mjs'
import { loadPersistedIndex } from './persist.mjs'
import { GRAPH_NAME, chainShow, collectGraph } from './graph.mjs'
import { collectComponents } from './components.mjs'
import {
  contentTerms,
  expandQuery,
  parseFrontmatter,
  processTerm,
  snippet,
  snippetNeedles,
  titleSimilarity,
  tokenize,
} from './text.mjs'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const COLLECTIONS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  'collections'
)
export const DEFAULT_LIMIT = 15
export const LIST_CAP = 300
export const GRAPH_BOOSTS = { title: 2 }

/** MiniSearch's BM25 parameters (k, b, d); a manifest's `"bm25"` overrides any of them. */
const BM25 = { k: 1.2, b: 0.7, d: 0.5 }
export function bm25Params(manifest) {
  return { ...BM25, ...(manifest?.bm25 ?? {}) }
}

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

/** Collect every doc of one manifest. */
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
    case 'core':
      return collectCore(join(root, manifest.root), root, manifest.name)
    case 'component':
      return collectComponents(join(root, manifest.root), root, manifest.name)
    case 'rs':
      return collectRs(join(root, manifest.root), root, manifest.name)
    case 'rs-case':
      return collectRsCases(join(root, manifest.root), root, manifest.name)
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

/**
 * One MiniSearch over docs; missing fields normalize to empty. `allowed`
 * (a manifest's `fields`) limits indexing to those fields; without it every
 * field a doc carries is indexed.
 */
export function buildIndex(docs, boosts, allowed = null) {
  const MiniSearch = loadMiniSearch()
  const fields = allowed ?? unionFields(docs)
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

const COLLECTION_PRIOR = { surfaces: 3, cases: 2, 'rs-cases': 2 }
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

function toHit(doc, score, terms, exclude, facets = {}) {
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
    facets,
  }
}

/** Facet filters given and non-empty, or null: the one shape a search takes. */
function activeFilters(facets) {
  return facets && Object.keys(facets).length ? facets : null
}

/**
 * The best `n` hits of each source, in score order within a source. Sources come
 * in the order of their best hit, which is the order hits arrive in, so the
 * first hit of each source sets its place.
 */
function bySource(hits, n, sourceOf) {
  const groups = new Map()
  for (const hit of hits) {
    const source = sourceOf(hit)
    const group = groups.get(source) ?? []
    if (group.length < n) group.push(hit)
    groups.set(source, group)
  }
  return [...groups.values()].flat()
}

/**
 * The hits a search shows, from hits already in score order: the ones whose
 * facets pass the filters, shaped by `perSource` (the best N of each source),
 * or else by the manifest's diversity caps; `total` counts the matches before
 * shaping. The caller cuts to the limit and builds the output.
 */
function shapeHits(scored, { filters = null, perSource = null, diversity = null, facetOf }) {
  const matching = filters ? scored.filter(hit => matchesFacets(facetOf(hit), filters)) : scored
  const shaped = perSource == null
    ? diversify(matching, diversity)
    : bySource(matching, perSource, hit => facetOf(hit).source ?? '')
  return { total: matching.length, shaped }
}

/**
 * Scales each hit by how much its title says the query's words: a title that
 * is exactly the query scores (1 + titleBoost) times. A page named for the
 * query then outranks its own sections, which repeat its words in a heading.
 * `pageBoost` scales a page (an id with no `#` part) over its sections.
 * Without either the ranking is untouched.
 */
function boostHits(hits, { titleBoost = 0, pageBoost = 1 } = {}, query = '') {
  if (!titleBoost && pageBoost === 1) return hits
  const queryTerms = contentTerms(query)
  return hits
    .map(hit => {
      const title = titleBoost ? 1 + titleBoost * titleSimilarity(hit.title ?? '', queryTerms) : 1
      const page = pageBoost !== 1 && !String(hit.id).includes('#') ? pageBoost : 1
      return { ...hit, score: hit.score * title * page }
    })
    .sort((a, b) => b.score - a.score)
}

/**
 * Keeps one page, one source or one repeated heading from filling a ranked
 * list: at most `perPage` hits from one page (an id is `page#section`), at
 * most `perSource` from one source (the id's part before its first colon), and
 * at most `perHeading` sections under one heading text (the title's last part,
 * by content words). Hits over a cap are deferred behind the rest, so the list
 * still fills up and nothing is dropped.
 */
function diversify(hits, diversity) {
  if (!diversity) return hits
  const { perPage = Infinity, perSource = Infinity, perHeading = Infinity } = diversity
  const pageCounts = new Map()
  const sourceCounts = new Map()
  const headingCounts = new Map()
  const kept = []
  const deferred = []
  for (const hit of hits) {
    const key = String(hit.id)
    const doc = key.startsWith(`${hit.collection}:`) ? key.slice(hit.collection.length + 1) : key
    const page = doc.split('#')[0]
    const source = doc.split(':')[0]
    const heading = doc.includes('#')
      ? [...contentTerms(String(hit.title ?? '').split(' › ').pop())].sort().join(' ')
      : ''
    const pages = pageCounts.get(page) ?? 0
    const sources = sourceCounts.get(source) ?? 0
    const sameHeading = heading ? (headingCounts.get(heading) ?? 0) : 0
    if (pages < perPage && sources < perSource && sameHeading < perHeading) {
      kept.push(hit)
      pageCounts.set(page, pages + 1)
      sourceCounts.set(source, sources + 1)
      if (heading) headingCounts.set(heading, sameHeading + 1)
    } else {
      deferred.push(hit)
    }
  }
  return [...kept, ...deferred]
}

/**
 * A manifest's concept vocabulary (concept -> keywords), read once per file.
 * Absent or unnamed means no vocabulary: a query is then searched as typed.
 */
const vocabularies = new Map()
export function loadVocabulary(manifest, root = ROOT) {
  if (!manifest?.vocabulary) return null
  const file = resolve(root, manifest.vocabulary)
  if (!vocabularies.has(file)) {
    try {
      vocabularies.set(file, JSON.parse(readFileSync(file, 'utf8')))
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
      vocabularies.set(file, null)
    }
  }
  return vocabularies.get(file)
}

function rankMini(
  docs,
  boosts,
  query,
  terms,
  limit,
  weigh,
  allowed = null,
  { rules = {}, searchText = query, bm25 = BM25, diversity = null, filters = null, perSource = null } = {}
) {
  const mini = buildIndex(docs, boosts, allowed)
  const byId = new Map(docs.map(d => [`${d.collection}:${d.id}`, d]))
  const facetOf = hit => facetsOf(byId.get(hit.id)?.fields)
  let scored = boostHits(mini.search(searchText, { bm25 }), rules, query)
  if (weigh) {
    scored = scored
      .map(hit => ({ ...hit, score: hit.score * prior(hit.collection) }))
      .sort((a, b) => b.score - a.score)
  }
  const { total, shaped } = shapeHits(scored, { filters, perSource, diversity, facetOf })
  const exclude = new Set()
  return {
    hits: shaped
      .slice(0, limit)
      .map(hit => toHit(byId.get(hit.id), hit.score, terms, exclude, facetOf(hit))),
    total,
  }
}

/** A hit's doc: read from its file now, so only shown hits cost a read. A file gone since the index was written keeps its record. */
function loadRecordDoc(record, manifest) {
  try {
    const doc = loadMarkdownDoc(resolve(ROOT, record.path), record.path, manifest)
    if (doc) return { ...doc, collection: record.collection, id: record.id, path: record.path }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
  return { collection: record.collection, id: record.id, title: record.title, extra: record.extra, path: record.path, snippetText: '', fields: {} }
}

/** Ranks a persisted index with the manifest's weights and reads only the shown hits. */
function rankPersisted(persisted, manifest, query, terms, limit, shape = {}) {
  const boost = Object.fromEntries(Object.entries(manifest.weights || {}))
  const searchText = expandQuery(query, loadVocabulary(manifest))
  const facetOf = hit => persisted.records.get(hit.id)?.facets ?? {}
  const scored = boostHits(
    persisted.mini.search(searchText, { prefix: true, fuzzy: 0.2, boost, bm25: bm25Params(manifest) }),
    manifest,
    query
  )
  const { total, shaped } = shapeHits(scored, { ...shape, diversity: manifest.diversity, facetOf })
  const exclude = new Set()
  return {
    hits: shaped
      .slice(0, limit)
      .map(hit =>
        toHit(loadRecordDoc(persisted.records.get(hit.id), manifest), hit.score, terms, exclude, facetOf(hit))
      ),
    total,
  }
}

/** Facet values in a collection's docs, from its persisted records or its live docs. */
function facetCatalog(all, collection) {
  const persisted = all.persisted?.get(collection)
  if (persisted) return [...persisted.records.values()].map(record => record.facets ?? {})
  return all.docs.filter(doc => doc.collection === collection).map(doc => facetsOf(doc.fields))
}

/**
 * Refuses facet filters a collection cannot answer: a facet none of its docs
 * carry, or a value none of them has. The error lists the values it does have.
 */
export function checkFilters(all, collection, facets) {
  const catalog = facetCatalog(all, collection)
  for (const [name, wanted] of Object.entries(facets)) {
    const known = facetValues(catalog, name)
    if (!known.length) throw new UsageError(`${collection} docs carry no ${name} field, so --${name} cannot filter them`)
    for (const value of wanted) {
      if (!known.some(item => item.toLowerCase() === value.toLowerCase())) {
        throw new UsageError(`unknown ${name} '${value}' in ${collection} (known: ${known.join(', ')})`)
      }
    }
  }
}

/**
 * The persisted indexes a verb can use: a ranked search of a collection whose
 * manifest names one (`"index"`). A missing or unreadable index is absent from
 * the map, and the search then indexes live.
 */
export function persistedFor(manifests, opts, root = ROOT) {
  const found = new Map()
  if (opts.cmd !== 'search' || opts.in == null || !opts.query.join(' ').trim()) return found
  const manifest = manifests.find(m => m.name.toLowerCase() === String(opts.in).toLowerCase())
  if (!manifest?.index) return found
  try {
    const loaded = loadPersistedIndex(resolve(root, manifest.index), manifest)
    if (loaded) found.set(manifest.name, loaded)
  } catch {
    // An unreadable index is a missing one: search indexes live instead.
  }
  return found
}

/**
 * Ranked search. No query + no collection lists collections; no query +
 * a collection lists its roster. Everything ranks through MiniSearch.
 * Global rank weights authoritative collections over evidence logs; a
 * targeted collection (`"targeted": true`) and the graph answer only --in.
 * `facets` keep the docs whose source or type is one of the listed values;
 * `perSource` keeps the best N hits of each source. Both need a collection.
 */
export function search(
  all,
  query,
  { collection = null, limit = DEFAULT_LIMIT, facets = null, perSource = null } = {}
) {
  const terms = query.trim().split(/\s+/).filter(Boolean)
  const filters = activeFilters(facets)
  if (collection == null && (filters || perSource != null)) {
    throw new UsageError('--source, --type and --per-source need --in <collection>')
  }
  if (collection != null) {
    const manifest = all.manifest(collection)
    if (filters) checkFilters(all, collection, filters)
    const persisted = all.persisted?.get(collection)
    if (persisted) return rankPersisted(persisted, manifest, query, terms, limit, { filters, perSource })
    const docs = all.docs.filter(d => d.collection === collection)
    const boosts = {}
    for (const [field, weight] of Object.entries(manifest.weights || {})) {
      boosts[field] = weight
    }
    return rankMini(docs, boosts, query, terms, limit, false, manifest.fields ?? null, {
      rules: manifest,
      searchText: expandQuery(query, loadVocabulary(manifest)),
      bm25: bm25Params(manifest),
      diversity: manifest.diversity ?? null,
      filters,
      perSource,
    })
  }
  const targeted = new Set(all.manifests.filter(m => m.targeted).map(m => m.name))
  const curated = all.docs.filter(d => d.collection !== GRAPH_NAME && !targeted.has(d.collection))
  const global = all.manifests.filter(m => !m.targeted)
  const titleBoost = Math.max(0, ...global.map(m => m.titleBoost ?? 0))
  return rankMini(curated, mergeBoosts(global), query, terms, limit, true, null, { rules: { titleBoost } })
}

/**
 * Which collections a verb needs. A targeted search loads only its own;
 * a global search skips the graph and targeted collections it never ranks.
 * Listings and show need everything.
 */
export function scopeFor(opts) {
  if (opts.cmd !== 'search') return () => true
  if (opts.in != null) {
    const name = String(opts.in).toLowerCase()
    return m => m.name.toLowerCase() === name
  }
  if (!opts.query.join(' ').trim()) return () => true
  return m => !m.system && !m.targeted
}

export function loadAll(manifests, root = ROOT, include = () => true) {
  const docs = []
  const warnings = []
  const counts = {}
  for (const manifest of manifests) {
    if (!include(manifest)) continue
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

/** A collection's docs in listing order, narrowed by facet filters when given (checked first). */
export function roster(all, collection, limit = LIST_CAP, facets = null) {
  const filters = activeFilters(facets)
  if (filters) checkFilters(all, collection, filters)
  const docs = all.docs.filter(
    d => d.collection === collection && (!filters || matchesFacets(facetsOf(d.fields), filters))
  )
  return { docs: docs.slice(0, limit), total: docs.length }
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

/**
 * A ref's leading `name:` is a collection only when a collection of that
 * name exists; otherwise the whole ref is a bare id (`panda:tokens` is an id
 * that contains a colon, not a collection named panda).
 */
function findById(all, ref) {
  const cut = ref.indexOf(':')
  const head = cut === -1 ? null : ref.slice(0, cut)
  if (head && head.toLowerCase() === 'rs') {
    return findById(all, `surfaces:${ref}`)
  }
  const known =
    head !== null && all.docs.some(d => d.collection.toLowerCase() === head.toLowerCase())
  const collection = known ? head : null
  const id = known ? ref.slice(cut + 1) : ref
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
    case 'core': {
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
    case 'rs-case': {
      const p = doc.payload
      const lines = [head, `path: ${doc.path}`, `module: ${p.module}`]
      if (p.related.length) lines.push(`related: ${p.related.join(' ')}`)
      if (p.specs.length) lines.push(`specs:\n  ${p.specs.join('\n  ')}`)
      lines.push(`\n${p.readme || '(no README)'}`)
      return lines.join('\n')
    }
    case 'markdown': {
      // The body alone, under its url when the doc has one; --json has the frontmatter.
      const body = parseFrontmatter(doc.payload.raw ?? '').body.trim()
      const url = doc.payload.frontmatter?.url
      const meta = [head, `path: ${doc.path}`, ...(url ? [`url: ${url}`] : [])]
      return `${meta.join('\n')}\n\n${body}`
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
