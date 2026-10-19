/**
 * Persisted index for a large targeted collection. A manifest with
 * `"index": "<base>"` names two files: `<base>.index.json` (the MiniSearch
 * index, as its own JSON) and `<base>.records.json` (one record per doc: key,
 * id, title, extra, path, facets). The writer (normalize, at the end of a run)
 * keeps them in step; a targeted search loads them instead of reading the corpus
 * and re-indexing it. A missing, unreadable, or mismatched pair returns null, and
 * the search then indexes live as it always did. Format 2 added each record's
 * facet values, so a format 1 pair is treated as absent and rebuilt.
 */

import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { facetsOf } from './facets.mjs'
import { processTerm, tokenize } from './text.mjs'

export const FORMAT = 2
const requireFromHere = createRequire(import.meta.url)

/** MiniSearch's class, from the workspace root install. */
export function loadMiniSearch() {
  const mod = requireFromHere('minisearch')
  return mod.default ?? mod
}

/** The construction options for a collection's index; stored fields are the result columns. */
export function indexOptions(fields) {
  return {
    fields,
    storeFields: ['collection', 'title'],
    idField: 'key',
    tokenize,
    processTerm,
    searchOptions: { prefix: true, fuzzy: 0.2 },
  }
}

export function persistedFiles(base) {
  return { index: `${base}.index.json`, records: `${base}.records.json` }
}

function writeAtomic(file, text) {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.tmp`
  writeFileSync(tmp, text)
  renameSync(tmp, file)
}

/** Writes the index and records for `docs` (built with `mini`) under `base`. */
export function writePersistedIndex({ base, mini, docs, manifest }) {
  const files = persistedFiles(base)
  const records = docs.map(doc => ({
    key: `${doc.collection}:${doc.id}`,
    collection: doc.collection,
    id: doc.id,
    title: doc.title,
    extra: doc.extra,
    path: doc.path,
    facets: facetsOf(doc.fields),
  }))
  writeAtomic(files.index, JSON.stringify(mini))
  writeAtomic(
    files.records,
    JSON.stringify({ format: FORMAT, collection: manifest.name, count: records.length, records })
  )
  return { ...files, count: records.length }
}

/**
 * The persisted index for `manifest`, as { mini, records: Map(key -> record) },
 * or null when the files are absent, of another format, or out of step.
 */
export function loadPersistedIndex(base, manifest) {
  const files = persistedFiles(base)
  if (!existsSync(files.index) || !existsSync(files.records)) return null
  let meta
  try {
    meta = JSON.parse(readFileSync(files.records, 'utf8'))
  } catch {
    return null
  }
  if (meta?.format !== FORMAT || meta.collection !== manifest.name) return null
  const MiniSearch = loadMiniSearch()
  const mini = MiniSearch.loadJSON(readFileSync(files.index, 'utf8'), indexOptions(manifest.fields ?? null))
  if (mini.documentCount !== meta.count || meta.records.length !== meta.count) return null
  const records = new Map(meta.records.map(record => [record.key, record]))
  return { mini, records }
}
